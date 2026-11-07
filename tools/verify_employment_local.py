#!/usr/bin/env python3
"""Actual local Supabase integration; never accepts a database URL or host."""
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import subprocess
import time
import urllib.request
import urllib.error
import uuid

ROOT=Path(__file__).resolve().parents[1]
DOCKER=['docker','--host','unix:///var/run/docker.sock','exec','-i','supabase_db_team6310-phase2-verification','psql','--host','/var/run/postgresql','--port','5432','-U','postgres','-d','postgres','-XAtq','-v','ON_ERROR_STOP=1']
API='http://127.0.0.1:55321'
ENV=dict(line.split('=',1) for line in (ROOT/'frontend/.env.verification.local').read_text().splitlines() if '=' in line)
assert ENV['VITE_SUPABASE_URL']==API
KEY=ENV['VITE_SUPABASE_PUBLISHABLE_KEY']

def sql(text, fail=False):
    p=subprocess.run(DOCKER,input=text,text=True,capture_output=True)
    if fail:
        assert p.returncode, 'Expected SQL failure'
        return p.stderr
    if p.returncode:raise RuntimeError(p.stderr)
    return p.stdout.strip()

def request(path, body=None, token=None, allowed=(200,201)):
    headers={'apikey':KEY,'Content-Type':'application/json'}
    if token:headers['Authorization']='Bearer '+token
    req=urllib.request.Request(API+path,headers=headers,data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(req,timeout=20) as r:code=r.status;result=json.load(r)
    except urllib.error.HTTPError as e:code=e.code;result=json.loads(e.read())
    assert code in allowed, f'Unexpected local API status {code}: {result}'
    return result

def auth(registered=False):
    body={'email':f'local-{uuid.uuid4()}@example.invalid','password':str(uuid.uuid4())+'aA!'} if registered else {}
    result=request('/auth/v1/signup',body)
    return result['access_token'],result['user']['id']

def main():
    # Refuse any nonempty application content: fixtures are installed only once.
    assert sql('select count(*) from public.personas;')=='0','Reset/reconstruct isolated local schema first.'
    a,aid=auth();b,bid=auth();registered,_=auth(True)
    v,p,poor,first,fallback,office,other_v,other_j=[str(uuid.uuid4()) for _ in range(8)]
    sql(f"""insert into content_versions(version_id,version_number,status,published_at) values('{v}',9001,'draft',null),('{other_v}',9000,'draft',null);
    insert into personas(persona_id,version_id,name,description,general_starting_balance,weekly_income,has_english_skills,has_computer_skills) values
    ('{p}','{v}','[LOCAL TEST] Alex','Synthetic local employment fixture.',200,0,false,false),
    ('{poor}','{v}','[LOCAL TEST] Low funds','Synthetic local affordability fixture.',59.99,0,false,false);
    insert into jobs(job_id,version_id,soc_code,title,median_hourly_wage,wage_year,reviewed_at,is_active,is_approved,needs_english_skills,needs_computer_skills) values
    ('{first}','{v}','00-0001','Local first job',10,2025,now(),true,true,false,false),
    ('{fallback}','{v}','00-0002','Local fallback job',10,2025,now(),true,true,false,false),
    ('{office}','{v}','00-0003','Local office job',10,2025,now(),true,true,true,true),
    ('{other_j}','{other_v}','00-0001','Other edition job',10,2025,now(),true,true,false,false);
    insert into persona_expenses(persona_id,version_id,name,amount,first_due_day) values('{p}','{v}','Local rent',50,7);
    update content_versions set status='published',published_at=now() where version_id in ('{v}','{other_v}');
    notify pgrst,'reload schema';""")
    for _ in range(20):
        try:request('/rest/v1/personas?select=persona_id');break
        except AssertionError:time.sleep(.25)
    def create(token=a,persona=p):return request('/rest/v1/rpc/start_individual_playthrough',{'p_persona_id':persona},token)
    def row(id):return json.loads(sql(f"select to_jsonb(p) from playthroughs p where playthrough_id='{id}';"))
    legacy=create();unknown=create();sql(f"update playthroughs set employment_state='{{\"schemaVersion\":99}}' where playthrough_id='{unknown}';")
    before={id:row(id) for id in (legacy,unknown)}
    sql("set cac.employment_security_reviewed='on';\n"+(ROOT/'supabase/migrations/20261103000000_employment_gameplay.sql').read_text())
    sql("notify pgrst,'reload schema';")
    for id in before:assert row(id)==before[id]
    metadata=json.loads(sql("""select json_agg(json_build_object('name',p.proname,'owner',p.proowner::regrole::text,'definer',p.prosecdef,'config',p.proconfig,'auth_exec',has_function_privilege('authenticated',p.oid,'EXECUTE'),'anon_exec',has_function_privilege('anon',p.oid,'EXECUTE'),'service_exec',has_function_privilege('service_role',p.oid,'EXECUTE'))) from pg_proc p where p.pronamespace='public'::regnamespace and p.proname in ('valid_employment_document','mark_fresh_employment_run','submit_employment_action');"""))
    assert len(metadata)==3
    for m in metadata:
        assert m['owner']=='postgres' and not m['anon_exec'] and not m['service_exec']
        assert m['auth_exec']==(m['name']=='submit_employment_action')
        assert m['definer']==(m['name']!='valid_employment_document')
        assert m['config']==['search_path=""']
    assert sql("select relrowsecurity and not relforcerowsecurity from pg_class where oid='public.playthroughs'::regclass;")=='t'
    time.sleep(.5)
    def action(id,intent,token=a,revision=None,request_id=None,reject=False):
        if revision is None:revision=row(id)['employment_state'].get('revision',0)
        data={'p_run_id':id,'p_request_id':request_id or str(uuid.uuid4()),'p_revision':revision,'p_action':intent}
        old=row(id)
        result=request('/rest/v1/rpc/submit_employment_action',data,token,allowed=(400,401,403,404) if reject else (200,))
        if reject:assert row(id)==old
        return result
    def go(id,type,**kw):return action(id,{'type':type,**kw})
    action(legacy,{'type':'initialize'},revision=0,reject=True);action(unknown,{'type':'initialize'},revision=0,reject=True)
    run=create();foreign=create(b)
    action(run,{'type':'initialize'},token=None,revision=0,reject=True)
    action(run,{'type':'initialize'},token=registered,revision=0,reject=True)
    action(run,{'type':'initialize'},token=b,revision=0,reject=True)
    assert request(f'/rest/v1/playthroughs?playthrough_id=eq.{run}&select=*',token=b)==[]
    request_id=str(uuid.uuid4());go(run,'initialize');rev=row(run)['employment_state']['revision']
    for bad in [{'type':'end','balance':999},{'type':'apply','jobId':None},{'type':'interview','choice':[]},{'type':'apply','jobId':other_j}]:action(run,bad,reject=True)
    go(run,'apply',jobId=first);go(run,'continue');go(run,'continue')
    rev=row(run)['employment_state']['revision'];intent={'type':'interview','choice':'purchase'}
    action(run,intent,revision=rev,request_id=request_id);saved=row(run)
    action(run,intent,revision=rev,request_id=request_id);assert row(run)==saved and float(saved['current_balance'])==140
    action(run,{'type':'interview','choice':'current'},revision=rev,request_id=request_id,reject=True)
    go(run,'continue');assert row(run)['current_day']==2
    go(run,'apply',jobId=fallback);go(run,'continue');go(run,'continue');go(run,'interview',choice='owned')
    assert row(run)['current_job_id']==fallback and float(row(run)['current_balance'])==140
    while row(run)['employment_state']['stage']!='complete':go(run,'continue')
    assert row(run)['status']=='completed' and float(row(run)['current_balance'])==1340
    assert row(run)['employment_state']['creditedDays']==[10,17,24]
    action(run,{'type':'end'},reject=True)
    replay=create();go(replay,'initialize',replayOf=run);go(replay,'prepare');go(replay,'continue');go(replay,'apply',jobId=office);go(replay,'continue');go(replay,'continue');go(replay,'interview',choice='cac')
    assert row(replay)['employment_state']['hiredDay']==2
    while row(replay)['employment_state']['stage']!='complete':go(replay,'continue')
    assert row(replay)['employment_state']['creditedDays']==[9,16,23,30]
    denied=create();action(denied,{'type':'initialize','replayOf':replay},reject=True);action(denied,{'type':'initialize','replayOf':foreign},reject=True)
    noDay=create();sql(f"update playthroughs set current_day=null where playthrough_id='{noDay}';");action(noDay,{'type':'initialize'},reject=True)
    low=create(persona=poor);go(low,'initialize');go(low,'apply',jobId=first);go(low,'continue');go(low,'continue');go(low,'interview',choice='purchase')
    assert row(low)['status']=='ended' and float(row(low)['current_balance'])==59.99
    action(low,{'type':'continue'},reject=True)
    # Two independent real DB connections, same revision: exactly one commit.
    race=create();go(race,'initialize');rev=row(race)['employment_state']['revision']
    def transaction(job):
        payload=json.dumps({'type':'apply','jobId':job})
        return subprocess.run(DOCKER,input=f"begin;set local role authenticated;select set_config('request.jwt.claims','{{\"sub\":\"{aid}\",\"is_anonymous\":true}}',true);select submit_employment_action('{race}','{uuid.uuid4()}',{rev},'{payload}');commit;",text=True,capture_output=True)
    with ThreadPoolExecutor(2) as pool:results=list(pool.map(transaction,[first,fallback]))
    assert sorted(r.returncode for r in results)==[0,3] and row(race)['employment_state']['revision']==rev+1
    # Hold another participant's row lock. A denied cross-owner request must not wait on it.
    held=subprocess.Popen(DOCKER,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    held.stdin.write(f"begin;select 1 from playthroughs where playthrough_id='{foreign}' for update;select pg_sleep(4);rollback;\n");held.stdin.close()
    time.sleep(.5)
    err=sql(f"begin;set local role authenticated;set local lock_timeout='200ms';select set_config('request.jwt.claims','{{\"sub\":\"{aid}\",\"is_anonymous\":true}}',true);select submit_employment_action('{foreign}','{uuid.uuid4()}',0,'{{\"type\":\"initialize\"}}');",fail=True)
    assert 'Run unavailable' in err and 'lock timeout' not in err
    held.wait()
    # Force a local constraint failure, then verify entire action/receipt rollback.
    rollback=create();go(rollback,'initialize');old=row(rollback)
    sql("alter table playthroughs add constraint local_rollback_test check(status<>'ended') not valid;")
    action(rollback,{'type':'end'},reject=True);assert row(rollback)==old
    sql('alter table playthroughs drop constraint local_rollback_test;')
    output={'version':v,'persona':p,'poor':poor,'first':first,'fallback':fallback,'office':office,'completed':run,'legacy':legacy,'unsupported':unknown,'functions':metadata}
    Path('/tmp/team6310-phase2-verification/fixture.json').write_text(json.dumps(output,indent=2))
    print('PASS: actual local Auth/API gameplay, ownership, both hire/payday routes, retries, legacy/unsupported preservation, terminal guards, real two-connection concurrency, foreign-row lock avoidance, rollback and function ACL/owner/search_path inspection.')

if __name__=='__main__':main()
