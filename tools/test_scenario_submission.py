#!/usr/bin/env python3
"""Real local Auth/API/PostgreSQL tests. Creates disposable local users/runs; never deletes them."""
import concurrent.futures
import json
from pathlib import Path
import subprocess
import urllib.request
import urllib.error
import uuid
import time
from load_day4_fixture import DOCKER, CONTAINER

ROOT=Path(__file__).resolve().parents[1]
SCENARIO='63100000-0000-4000-8000-000000000004'
CHOICES=['63100000-0000-4000-8000-00000000004'+str(i) for i in (1,2,3)]

def main():
    info=json.loads(subprocess.check_output(DOCKER+['inspect',CONTAINER],text=True))[0]
    assert info['State']['Running'] and any(m.get('Name')==CONTAINER for m in info['Mounts'])
    env={}
    for line in (ROOT/'frontend/.env.verification.local').read_text().splitlines():
        if '=' in line:
            k,v=line.split('=',1);env[k]=v.strip().strip('\"\'')
    api=env['VITE_SUPABASE_URL'];assert api=='http://127.0.0.1:55321'
    def request(path,body=None,token=None):
        headers={'apikey':env['VITE_SUPABASE_PUBLISHABLE_KEY'],'Content-Type':'application/json'}
        if token:headers['Authorization']='Bearer '+token
        req=urllib.request.Request(api+path,headers=headers,data=None if body is None else json.dumps(body).encode())
        try:
            with urllib.request.urlopen(req,timeout=20) as response:return response.status,json.load(response)
        except urllib.error.HTTPError as error:return error.code,json.loads(error.read())
    def sql(statement):
        return subprocess.run(DOCKER+['exec','-i',CONTAINER,'psql','--host','/var/run/postgresql','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1'],input=statement,text=True,capture_output=True,check=True).stdout.strip()
    original_ids=sql("select coalesce(string_agg(quote_literal(playthrough_id::text),','),'NULL') from public.playthroughs;")
    preservation=f"""select md5(coalesce(jsonb_agg(to_jsonb(p) order by playthrough_id)::text,'')) from public.playthroughs p where playthrough_id in ({original_ids});
select md5(string_agg(pg_get_functiondef(oid),'' order by proname)) from pg_proc where pronamespace='public'::regnamespace and proname in ('submit_employment_action','mark_fresh_employment_run','valid_employment_document');"""
    before=sql(preservation)
    def participant():
        status,user=request('/auth/v1/signup',{})
        assert status==200 and user['user']['is_anonymous']
        token=user['access_token'];uid=user['user']['id']
        status,run=request('/rest/v1/rpc/open_local_day4_run',{},token);assert status==200
        return token,uid,run
    def submit(token,run,choice):
        return request('/rest/v1/rpc/submit_scenario_decision',{'p_run_id':run,'p_scenario_id':SCENARIO,'p_choice_id':choice},token)
    def state(run):return json.loads(sql(f"select to_jsonb(p) from public.playthroughs p where playthrough_id='{run}';"))
    def count(run):return int(sql(f"select count(*) from public.player_responses where playthrough_id='{run}';"))
    def restore(token,run):
        return request('/rest/v1/rpc/restore_scenario_decision',{'p_run_id':run,'p_scenario_id':SCENARIO},token)
    # Deterministic reproduction of the old two-request race.
    token,uid,run=participant()
    legacy_run=state(run)
    assert submit(token,run,CHOICES[0])[0]==200
    status,legacy_responses=request('/rest/v1/player_responses?select=balance_after&playthrough_id=eq.'+run,token=token)
    assert status==200 and legacy_run['current_balance']==200 and legacy_responses[0]['balance_after']==225
    status,consistent=restore(token,run)
    assert status==200 and consistent['run']['current_balance']==consistent['response']['balance_after']==225
    # Pause a restore statement after its MVCC snapshot is established. Commit
    # a submission on a separate API connection before the paused read finishes.
    token,uid,run=participant()
    command=DOCKER+['exec','-i',CONTAINER,'psql','--host','/var/run/postgresql','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1']
    key=63100043
    blocker=subprocess.Popen(command,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1)
    blocker.stdin.write(f"BEGIN; SELECT pg_advisory_xact_lock({key});\n\\echo LOCKED\n")
    blocker.stdin.flush()
    while blocker.stdout.readline().strip()!='LOCKED':
        if blocker.poll() is not None: raise AssertionError('Local barrier failed')
    try:
        with concurrent.futures.ThreadPoolExecutor(1) as pool:
            query=f"""SET application_name='scenario_restore_race';
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{{"sub":"{uid}","is_anonymous":true}}',false);
SELECT public.restore_scenario_decision('{run}','{SCENARIO}') FROM (SELECT pg_advisory_xact_lock({key})) barrier;"""
            pending=pool.submit(sql,query)
            try:
                for _ in range(100):
                    if sql("select count(*) from pg_stat_activity where application_name='scenario_restore_race' and wait_event='advisory';")=='1':break
                    time.sleep(.02)
                else:raise AssertionError('Restore did not reach barrier')
                assert submit(token,run,CHOICES[0])[0]==200
            finally:
                blocker.stdin.write('ROLLBACK;\n\\q\n');blocker.stdin.flush()
            paused=json.loads(pending.result(timeout=20).splitlines()[-1])
            assert paused['run']['current_balance']==200 and paused['response'] is None
    finally:
        if blocker.poll() is None: blocker.communicate(timeout=10)
    status,latest=restore(token,run)
    assert status==200 and latest['run']['current_balance']==latest['response']['balance_after']==225
    other,_,_=participant()
    assert restore(other,run)[1] is None and restore(None,run)[0]>=400
    print('PASS: reproduced old mixed-state race; concurrent atomic restore returns wholly pre-commit, later restore wholly post-commit; owner access enforced.')
    # Day 3 fixture clones exist only inside rolled-back test transactions.
    token,uid,run=participant();original=state(run)
    for hired,stage,allowed in [(None,'day',False),(3,'day',False),(2,'interview-result',False),(2,'income',False),(2,'day',True)]:
        scenario_id=str(uuid.uuid4());choice_id=str(uuid.uuid4())
        expected="""PERFORM public.submit_scenario_decision('%s','%s','%s');
IF (SELECT count(*) FROM public.player_responses WHERE playthrough_id='%s')<>1 THEN RAISE EXCEPTION 'Missing Day 3 response'; END IF;""" % (run,scenario_id,choice_id,run) if allowed else """BEGIN PERFORM public.submit_scenario_decision('%s','%s','%s'); RAISE EXCEPTION 'Ineligible Day 3 accepted';
EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Not an ordinary scenario day' THEN RAISE; END IF; END;
IF EXISTS(SELECT 1 FROM public.player_responses WHERE playthrough_id='%s') THEN RAISE EXCEPTION 'Rejected response persisted'; END IF;""" % (run,scenario_id,choice_id,run)
        document=json.dumps({'hiredDay':hired,'stage':stage})
        sql(f"""BEGIN;
INSERT INTO public.scenarios(scenario_id,title,default_day,version_id,persona_intent,schedule_type) VALUES('{scenario_id}','[LOCAL TEST] Day 3',3,'3c463a7f-7036-4e0c-9c1b-1f5db7c502f3','cfe33068-d657-482f-b770-ef3918a87e03','scheduled');
INSERT INTO public.choices(choice_id,scenario_id,choice_text,balance_change,response_text,next_scenario_id,version_id) VALUES('{choice_id}','{scenario_id}','Zero',0,'Recorded',null,'3c463a7f-7036-4e0c-9c1b-1f5db7c502f3');
UPDATE public.playthroughs SET current_scenario_id=NULL WHERE playthrough_id='{run}';
UPDATE public.playthroughs SET current_day=3,current_scenario_id='{scenario_id}',employment_state='{document}'::jsonb WHERE playthrough_id='{run}';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{{"sub":"{uid}","is_anonymous":true}}',true);
DO $$ BEGIN {expected} END $$;
ROLLBACK;""")
    assert state(run)==original and count(run)==0
    print('PASS: ordinary Day 3 requires Day 2 hire and day stage; absent hire, Day 3 hire, interview recap and pending income rejected.')
    token,uid,run=participant()
    sql(f"update public.playthroughs set current_balance=10 where playthrough_id='{run}';")
    status,ended=submit(token,run,CHOICES[1])
    assert status==200 and ended['run']['status']=='ended' and ended['run']['current_balance']==10 and ended['response'] is None
    assert count(run)==0 and ended['run']['current_day']==4 and ended['run']['employment_state'] is None
    status,restored=restore(token,run)
    assert status==200 and restored['run']['status']=='ended' and restored['run']['current_balance']==10 and restored['response'] is None
    assert submit(token,run,CHOICES[1])[0]>=400 and submit(token,run,CHOICES[2])[0]>=400
    assert count(run)==0 and state(run)['current_balance']==10
    for balance,choice in [(15,CHOICES[1]),(0,CHOICES[2])]:
        token,uid,run=participant();sql(f"update public.playthroughs set current_balance={balance} where playthrough_id='{run}';")
        status,result=submit(token,run,choice)
        assert status==200 and result['run']['current_balance']==0 and result['run']['status']=='active' and count(run)==1
    print('PASS: unaffordable choice ends without charge/response; ending restores, retries cannot charge; exact funds and zero-cost at zero remain active.')
    for choice,delta in zip(CHOICES,[25,-15,0]):
        token,uid,run=participant();original=state(run)
        status,result=submit(token,run,choice);assert status==200 and result['response']['balance_change_applied']==delta
        assert result['run']['current_balance']==200+delta and count(run)==1
        assert submit(token,run,choice)[0]==200 and count(run)==1
        assert submit(token,run,CHOICES[(CHOICES.index(choice)+1)%3])[0]>=400
        restored=request('/rest/v1/player_responses?select=choice_id,balance_after&playthrough_id=eq.'+run,token=token)
        assert restored[0]==200 and len(restored[1])==1 and restored[1][0]['balance_after']==200+delta
        assert state(run)['employment_state']==original['employment_state'] and state(run)['current_day']==4
        assert request('/rest/v1/rpc/open_local_day4_run',{},token)[1]==run
    print('PASS: positive, negative, zero, repeated retry, different-choice rejection, owner restoration, unchanged employment/day.')
    token,uid,run=participant();other,_,_=participant()
    assert submit(other,run,CHOICES[0])[0]>=400
    assert submit(None,run,CHOICES[0])[0]>=400
    assert request('/rest/v1/playthroughs?select=playthrough_id&playthrough_id=eq.'+run,token=other)[1]==[]
    assert request('/rest/v1/player_responses',{'playthrough_id':run,'choice_id':CHOICES[0]},token)[0]>=400
    assert count(run)==0 and state(run)['current_balance']==200
    print('PASS: unauthenticated/cross-owner rejection, RLS isolation, direct response insert denied.')
    with concurrent.futures.ThreadPoolExecutor(2) as pool:
        results=list(pool.map(lambda choice:submit(token,run,choice),CHOICES[:2]))
    assert sorted(status for status,_ in results)==[200,400] and count(run)==1
    winner=next(result for status,result in results if status==200)
    assert state(run)['current_balance']==winner['response']['balance_after']
    print('PASS: concurrent different choices commit exactly once.')
    token,uid,run=participant()
    with concurrent.futures.ThreadPoolExecutor(2) as pool:
        results=list(pool.map(lambda _:submit(token,run,CHOICES[0]),range(2)))
    assert all(status==200 for status,_ in results) and count(run)==1 and state(run)['current_balance']==225
    print('PASS: concurrent identical retries apply once.')
    token,uid,run=participant();bad=str(uuid.uuid4())
    sql(f"""BEGIN;
insert into public.choices(choice_id,scenario_id,choice_text,balance_change,response_text,next_scenario_id,version_id) values('{bad}','{SCENARIO}','[LOCAL TEST] wrong edition',25,'Wrong edition',null,'33f89a19-2790-40d4-bd14-c856334ec4ec');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{{"sub":"{uid}","is_anonymous":true}}',true);
DO $$ BEGIN
 BEGIN PERFORM public.submit_scenario_decision('{run}','{SCENARIO}','{bad}'); RAISE EXCEPTION 'Wrong edition accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Choice edition or scenario mismatch' THEN RAISE; END IF; END;
END $$;
ROLLBACK;""")
    assert count(run)==0 and state(run)['current_balance']==200
    sql(f"update public.playthroughs set status='ended' where playthrough_id='{run}';")
    assert submit(token,run,CHOICES[0])[0]>=400
    sql(f"update public.playthroughs set status='active',current_scenario_id=null where playthrough_id='{run}';")
    assert submit(token,run,CHOICES[0])[0]>=400
    print('PASS: wrong-version, inactive and wrong-current-scenario rejection.')
    token,uid,run=participant()
    # Inject an INSERT failure inside a transaction; all test DDL rolls back.
    rollback=f"""BEGIN;
CREATE FUNCTION public.local_test_response_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected response failure'; END $$;
CREATE TRIGGER local_test_response_failure BEFORE INSERT ON public.player_responses FOR EACH ROW EXECUTE FUNCTION public.local_test_response_failure();
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{{"sub":"{uid}","is_anonymous":true}}',true);
DO $$ BEGIN
 BEGIN PERFORM public.submit_scenario_decision('{run}','{SCENARIO}','{CHOICES[0]}'); RAISE EXCEPTION 'injection did not fire';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'injected response failure' THEN RAISE; END IF; END;
 IF (SELECT current_balance FROM public.playthroughs WHERE playthrough_id='{run}')<>200 THEN RAISE EXCEPTION 'balance leaked'; END IF;
END $$;
ROLLBACK;"""
    sql(rollback);assert count(run)==0 and state(run)['current_balance']==200
    assert submit(token,run,CHOICES[0])[0]==200 and count(run)==1
    # Exercise the unchanged Phase 2 RPC on a fresh ordinary employment run.
    token,uid,_=participant()
    status,employment=request('/rest/v1/rpc/start_individual_playthrough',{'p_persona_id':'cfe33068-d657-482f-b770-ef3918a87e03'},token)
    assert status==200
    jobs=sql("select job_id from public.jobs where version_id='3c463a7f-7036-4e0c-9c1b-1f5db7c502f3' and is_active and is_approved and needs_english_skills=false and needs_computer_skills=false order by job_id limit 2;").splitlines()
    assert len(jobs)==2
    def employment_action(kind,**fields):
        current=state(employment)
        status,result=request('/rest/v1/rpc/submit_employment_action',{'p_run_id':employment,'p_request_id':str(uuid.uuid4()),'p_revision':current['employment_state']['revision'],'p_action':{'type':kind,**fields}},token)
        assert status==200, 'Employment regression failure'
        return result
    employment_action('initialize');employment_action('apply',jobId=jobs[0]);employment_action('continue');employment_action('continue')
    employment_action('interview',choice='purchase');employment_action('continue');employment_action('apply',jobId=jobs[1])
    employment_action('continue');employment_action('continue');employment_action('interview',choice='owned')
    for _ in range(65):
        if state(employment)['employment_state']['stage']=='complete':break
        current=state(employment)
        if current['current_scenario_id']==SCENARIO and count(employment)==0:
            status,_=request('/rest/v1/rpc/submit_employment_action',{'p_run_id':employment,'p_request_id':str(uuid.uuid4()),'p_revision':current['employment_state']['revision'],'p_action':{'type':'continue'}},token)
            assert status>=400 and state(employment)==current
            assert submit(token,employment,CHOICES[0])[0]==200
            assert state(employment)['employment_state']==current['employment_state']
        employment_action('continue')
    completed=state(employment)
    assert completed['status']=='completed' and completed['current_day']==30
    assert completed['employment_state']['creditedDays']==[10,17,24] and count(employment)==1
    print('PASS: unchanged employment RPC completes Day 2 failure/reapplication, Day 3 hiring and Day 10/17/24 paydays.')
    assert before==sql(preservation)
    print('PASS: response INSERT failure rolls back balance; retry succeeds; original employment data/functions preserved.')

if __name__=='__main__':main()
