#!/usr/bin/env python3
"""Stage 3 genuine Auth/HTTP verification. Fixed local stack only; no migrations/browser.

All fixture accounts/content are tracked by newly generated UUIDs and removed in
finally. Existing application rows and Auth users must fingerprint identically.
Credentials/tokens remain in memory; private evidence contains UUIDs/results only.
"""
from decimal import Decimal
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
API = 'http://127.0.0.1:55321'
DB = ['docker', '--context', 'default', 'exec', '-i',
      'supabase_db_team6310-phase2-verification', 'psql', '-U', 'postgres',
      '-d', 'postgres', '-XAtq', '-v', 'ON_ERROR_STOP=1']
BILLS_VERSION = '63100000-0000-4000-8000-000000000800'


def sql(statement):
    result = subprocess.run(DB, input=statement, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip())
    return result.stdout.strip()


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise RuntimeError('Refusing redirected local API request')


class Harness:
    def __init__(self):
        values = dict(line.split('=', 1) for line in
                      (ROOT / 'frontend/.env.verification.local').read_text().splitlines()
                      if '=' in line)
        assert values['VITE_SUPABASE_URL'] == API
        self.key = values['VITE_SUPABASE_PUBLISHABLE_KEY']
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
        self.folder = Path(tempfile.mkdtemp(prefix='team6310-stage3-api-'))
        self.folder.chmod(0o700)
        self.actors = {}
        self.runs = set()
        self.groups = set()
        self.edition = str(uuid.uuid4())
        self.fixture_persona = str(uuid.uuid4())
        self.results = []
        self.requests = 0
        self.before = None
        self.schema_before = None

    def evidence(self):
        # Deliberately omit session tokens, passwords and API keys.
        data = {'results': self.results, 'auth_uuids': {k: a['id'] for k, a in self.actors.items()},
                'test_runs': sorted(self.runs), 'test_groups': sorted(self.groups),
                'fixture_edition': self.edition, 'requests': self.requests}
        path = self.folder / 'results.json'
        path.write_text(json.dumps(data, indent=2))
        path.chmod(0o600)

    def request(self, path, body=None, actor=None, method=None, allowed=(200, 201, 204)):
        assert path.startswith('/') and not path.startswith('//')
        headers = {'apikey': self.key, 'Content-Type': 'application/json'}
        if actor:
            headers['Authorization'] = 'Bearer ' + actor['access_token']
        req = urllib.request.Request(API + path, headers=headers,
                                     data=None if body is None else json.dumps(body).encode(),
                                     method=method)
        self.requests += 1
        try:
            with self.opener.open(req, timeout=25) as response:
                code, content = response.status, response.read()
        except urllib.error.HTTPError as error:
            code, content = error.code, error.read()
        result = json.loads(content) if content else None
        if code not in allowed:
            # Never print request bodies or Auth response tokens.
            detail = result.get('message', result.get('msg', result.get('error_description', ''))) if isinstance(result, dict) else ''
            raise AssertionError(f'{method or ("POST" if body is not None else "GET")} {path.split("?")[0]} HTTP {code}: {detail}')
        return result

    def rpc(self, name, body, actor, denied=False):
        return self.request('/rest/v1/rpc/' + name, body, actor,
                            allowed=(400, 401, 403, 404) if denied else (200,))

    def user(self, actor):
        user = self.request('/auth/v1/user', actor=actor)
        assert user['id'] == actor['id']
        return user

    def actor(self, name, staff=False):
        email = f'stage3-{uuid.uuid4()}@example.invalid'
        password = str(uuid.uuid4()) + 'aA!'
        session = self.request('/auth/v1/signup', {'email': email, 'password': password} if staff else {})
        actor = {**session, 'id': session['user']['id']}
        assert str(uuid.UUID(actor['id'])) == actor['id']
        self.actors[name] = actor
        self.evidence()
        assert self.user(actor)['is_anonymous'] is (not staff)
        if staff:
            session = self.request('/auth/v1/token?grant_type=password', {'email': email, 'password': password})
            assert session['user']['id'] == actor['id']
            actor.update(session)
        return actor

    def authorize(self, actor):
        sql(f"INSERT INTO public.cac_staff(user_id) VALUES('{actor['id']}');")
        assert self.rpc('is_cac_staff', {}, actor) is True

    def refresh(self, actor):
        session = self.request('/auth/v1/token?grant_type=refresh_token', {'refresh_token': actor['refresh_token']})
        assert session['user']['id'] == actor['id']
        actor.update(session)
        self.user(actor)

    def create(self, actor):
        rid = self.rpc('start_individual_playthrough', {'p_persona_id': self.persona}, actor)
        self.runs.add(rid)
        self.evidence()
        assert self.row(rid, actor)['owner_user_id'] == self.user(actor)['id']
        return rid

    def row(self, rid, actor):
        rows = self.request(f'/rest/v1/playthroughs?select=*&playthrough_id=eq.{rid}', actor=actor)
        assert len(rows) == 1, 'Owned REST run not visible'
        return rows[0]

    def snapshot(self, rid, actor):
        value = self.rpc('get_bill_snapshot', {'p_run_id': rid}, actor)
        assert value['run']['owner_user_id'] == actor['id']
        return value

    def action(self, rid, actor, kind, extra=None, revision=None, request_id=None, denied=False):
        if revision is None:
            revision = self.row(rid, actor)['employment_state']['revision']
        return self.rpc('submit_employment_action', {
            'p_run_id': rid, 'p_request_id': request_id or str(uuid.uuid4()),
            'p_revision': revision, 'p_action': {'type': kind, **(extra or {})}}, actor, denied)

    def check(self, name, operation):
        try:
            operation()
            self.results.append({'case': name, 'result': 'passed genuine Auth/API'})
            print('PASS:', name, flush=True)
        except Exception as error:
            self.results.append({'case': name, 'result': 'failed', 'cause': str(error)})
            print('FAIL:', name, str(error), flush=True)
        self.evidence()

    def fingerprints(self):
        text = sql("""CREATE FUNCTION pg_temp.fingerprint() RETURNS jsonb LANGUAGE plpgsql AS $$
        DECLARE t record; value jsonb; result jsonb:='{}'; BEGIN
        FOR t IN SELECT n.nspname,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE c.relkind='r' AND (n.nspname IN ('public','group_private') OR (n.nspname='auth' AND c.relname='users')) LOOP
          EXECUTE format('SELECT jsonb_build_object(''count'',count(*),''hash'',md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text)::text,''''))) FROM %I.%I t',t.nspname,t.relname) INTO value;
          result:=result||jsonb_build_object(t.nspname||'.'||t.relname,value);
        END LOOP; RETURN result; END $$; SELECT pg_temp.fingerprint();""")
        return json.loads(text)

    def schema(self):
        return sql("""SELECT md5(jsonb_build_object(
        'functions',(SELECT jsonb_agg(jsonb_build_array(n.nspname,p.proname,pg_get_functiondef(p.oid),p.proacl) ORDER BY p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','group_private') AND p.prokind='f'),
        'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY schemaname,tablename,policyname) FROM pg_policies p WHERE schemaname IN ('public','group_private')),
        'triggers',(SELECT jsonb_agg(pg_get_triggerdef(t.oid) ORDER BY t.oid) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','group_private') AND NOT t.tgisinternal))::text);""")

    def setup(self, group_only=False):
        assert sql("SELECT to_regprocedure('public.is_individual_player()') IS NOT NULL;") == 't'
        self.before, self.schema_before = self.fingerprints(), self.schema()
        personas = self.request('/rest/v1/personas?select=persona_id&version_id=eq.' + BILLS_VERSION + '&name=eq.%5BLOCAL%20TEST%5D%20Bills%20Alex')
        assert len(personas) == 1
        self.persona = personas[0]['persona_id']
        self.jobs = self.request('/rest/v1/jobs?select=job_id&version_id=eq.' + BILLS_VERSION + '&is_active=eq.true&is_approved=eq.true&needs_english_skills=eq.false&needs_computer_skills=eq.false&order=job_id')
        assert len(self.jobs) >= 2
        self.actor('anonymous')
        if group_only:
            return
        a = self.actor('staff_a', True)
        # Exercise genuine ordinary-auth denial before granting this same account staff access.
        assert self.rpc('is_cac_staff', {}, a) is False
        self.rpc('start_individual_playthrough', {'p_persona_id': self.persona}, a, denied=True)
        for name in ['staff_b', 'revocable']:
            self.actor(name, True)
        for name in ['staff_a', 'staff_b', 'revocable']:
            self.authorize(self.actors[name])
        self.results.append({'case': 'genuine anonymous/password sessions; ordinary-auth denial before staff provisioning', 'result': 'passed genuine Auth/API'})

    def lifecycle(self, actor):
        rid = self.create(actor)
        original = self.snapshot(rid, actor)
        assert len(original['bills']) == 8
        decisions, paid, ignored = 0, 0, 0
        for _ in range(160):
            state = self.snapshot(rid, actor)
            row = state['run']
            stage, day = row['employment_state']['stage'], row['current_day']
            if stage == 'complete':
                break
            if stage == 'uninitialized':
                self.action(rid, actor, 'initialize')
            elif stage in ('board', 'reapply'):
                self.action(rid, actor, 'apply', {'jobId': self.jobs[0 if stage == 'board' else 1]['job_id']})
            elif stage == 'interview':
                self.action(rid, actor, 'interview', {'choice': 'current'})
            elif stage == 'day':
                for bill in state['bills']:
                    if bill['due_day'] != day or bill['paid_at'] or bill['ignored_at']:
                        continue
                    kind = 'ignore' if day == 30 else 'pay'
                    body = {'p_run_id': rid, 'p_occurrence_id': bill['playthrough_expense_id']}
                    first = self.rpc(kind + '_bill', body, actor)
                    retry = self.rpc(kind + '_bill', body, actor)
                    assert first == retry, 'Duplicate bill request changed committed result'
                    paid += kind == 'pay'
                    ignored += kind == 'ignore'
                row = self.row(rid, actor)
                if row['current_scenario_id']:
                    choices = self.request('/rest/v1/choices?select=choice_id&scenario_id=eq.' + row['current_scenario_id'] + '&balance_change=eq.0', actor=actor)
                    assert len(choices) == 1
                    body = {'p_run_id': rid, 'p_scenario_id': row['current_scenario_id'], 'p_choice_id': choices[0]['choice_id']}
                    first = self.rpc('submit_scenario_decision', body, actor)
                    assert self.rpc('submit_scenario_decision', body, actor) == first
                    restored = self.rpc('restore_scenario_decision', {'p_run_id': rid, 'p_scenario_id': row['current_scenario_id']}, actor)
                    assert restored['response_count'] == 1
                    assert restored['run']['owner_user_id'] == actor['id']
                    decisions += 1
                self.action(rid, actor, 'continue')
            else:
                assert stage in ('preparation-result', 'application-result', 'interview-result', 'reapply-result', 'income')
                self.action(rid, actor, 'continue')
        else:
            raise AssertionError('Run failed to complete within action limit')
        final = self.snapshot(rid, actor)
        assert final['run']['status'] == 'completed' and final['run']['current_day'] == 30
        assert final['run']['employment_state']['creditedDays'] == [10, 17, 24]
        assert paid and ignored and decisions >= 4
        assert Decimal(str(final['outstanding_total'])) == 71
        income = sum(max(Decimal(str(e['change'])), 0) for e in final['run']['employment_state']['history'])
        assert Decimal(str(final['run']['current_balance'])) == Decimal(str(original['run']['current_balance'])) + income - Decimal(str(final['paid_total']))
        self.refresh(actor)
        assert self.snapshot(rid, actor) == final
        replay = self.create(actor)
        self.action(replay, actor, 'initialize', {'replayOf': rid})
        assert self.row(replay, actor)['cac_support_enabledabled'] is True
        self.action(replay, actor, 'prepare')
        request_id = str(uuid.uuid4())
        revision = self.row(replay, actor)['employment_state']['revision']
        first = self.action(replay, actor, 'end', revision=revision, request_id=request_id)
        assert self.action(replay, actor, 'end', revision=revision, request_id=request_id) == first
        actor['completed_run'] = rid

    def staff_restore(self):
        a = self.actors['staff_b']
        rid = self.create(a)
        request_id = str(uuid.uuid4())
        committed = self.action(rid, a, 'initialize', revision=0, request_id=request_id)
        before = self.snapshot(rid, a)
        self.refresh(a)
        assert self.snapshot(rid, a) == before
        assert self.row(rid, a)['owner_user_id'] == a['id']
        assert self.action(rid, a, 'initialize', revision=0, request_id=request_id) == committed
        self.action(rid, a, 'end')
        a['test_run'] = rid
        # Dashboard boundary: same Auth user/session remains active and staff-authorized.
        assert self.user(a)['id'] == a['id'] and self.rpc('is_cac_staff', {}, a) is True
        assert self.request('/rest/v1/cac_services?select=service_key', actor=a) == []

    def cross_owner(self):
        a, b = self.actors['staff_a'], self.actors['staff_b']
        rid = a['completed_run']
        assert self.request('/rest/v1/playthroughs?select=*&playthrough_id=eq.' + rid, actor=b) == []
        assert self.request('/rest/v1/playthrough_expenses?select=*&playthrough_id=eq.' + rid, actor=b) == []
        assert self.request('/rest/v1/player_responses?select=*&playthrough_id=eq.' + rid, actor=b) == []
        assert self.rpc('get_bill_snapshot', {'p_run_id': rid}, b) is None
        state = self.snapshot(rid, a)
        for name, args in [('submit_employment_action', {'p_run_id': rid, 'p_request_id': str(uuid.uuid4()), 'p_revision': state['run']['employment_state']['revision'], 'p_action': {'type': 'end'}}), ('pay_bill', {'p_run_id': rid, 'p_occurrence_id': state['bills'][0]['playthrough_expense_id']}), ('ignore_bill', {'p_run_id': rid, 'p_occurrence_id': state['bills'][0]['playthrough_expense_id']})]:
            self.rpc(name, args, b, denied=True)
        assert self.snapshot(rid, a) == state

    def revocation(self):
        a = self.actors['revocable']
        rid = self.create(a)
        self.action(rid, a, 'initialize')
        old_token = a['access_token']
        sql(f"UPDATE public.cac_staff SET active=false WHERE user_id='{a['id']}';")
        assert self.user(a)['id'] == a['id'] and a['access_token'] == old_token
        assert self.rpc('is_cac_staff', {}, a) is False
        assert self.rpc('is_individual_player', {}, a) is False
        for table in ['playthroughs', 'player_responses', 'playthrough_expenses']:
            assert self.request(f'/rest/v1/{table}?select=*&playthrough_id=eq.{rid}', actor=a) == []
        assert self.rpc('get_bill_snapshot', {'p_run_id': rid}, a) is None
        assert self.rpc('get_event_recap_facts', {'p_run_id': rid, 'p_event_key': 'D001'}, a) == []
        for name, body in [('start_individual_playthrough', {'p_persona_id': self.persona}), ('submit_employment_action', {'p_run_id': rid, 'p_request_id': str(uuid.uuid4()), 'p_revision': 1, 'p_action': {'type': 'end'}}), ('pay_bill', {'p_run_id': rid, 'p_occurrence_id': str(uuid.uuid4())}), ('ignore_bill', {'p_run_id': rid, 'p_occurrence_id': str(uuid.uuid4())}), ('submit_scenario_decision', {'p_run_id': rid, 'p_scenario_id': str(uuid.uuid4()), 'p_choice_id': str(uuid.uuid4())})]:
            self.rpc(name, body, a, denied=True)
        self.refresh(a)
        assert self.rpc('is_cac_staff', {}, a) is False
        self.rpc('start_individual_playthrough', {'p_persona_id': self.persona}, a, denied=True)

    def staff_group_denial(self):
        for a in [self.actors['staff_a'], self.actors['staff_b']]:
            for name, args in [('configure_host_group_session', {'p_create': True, 'p_decision_duration_seconds': 60, 'p_cac_support_enabled': False}), ('join_group_session', {'p_code': 'MISSINGCODE'}), ('get_group_session_state', {'p_session_id': str(uuid.uuid4())}), ('submit_group_job_vote', {'p_session_id': str(uuid.uuid4()), 'p_job_id': self.jobs[0]['job_id']}), ('submit_group_vote', {'p_session_id': str(uuid.uuid4()), 'p_choice_id': str(uuid.uuid4())})]:
                error = self.rpc(name, args, a, denied=True)
                assert error['code'] == '42501' and 'Anonymous session required' in error['message']

    def group_fixture(self):
        # Separate synthetic edition only; original content never changes.
        sql(f"""BEGIN;
        INSERT INTO public.content_versions(version_id,version_number,status,published_at,created_by,change_summary)
        SELECT '{self.edition}',max(version_number)+1,'draft',null,null,'[STAGE3 TEST] temporary group fixture' FROM public.content_versions;
        DO $$ DECLARE p public.personas%rowtype; j public.jobs%rowtype; columns_sql text; sid uuid; category uuid; n integer;
        BEGIN
          SELECT * INTO STRICT p FROM public.personas WHERE persona_id='{self.persona}';
          p.persona_id:='{self.fixture_persona}';p.version_id:='{self.edition}';p.name:='[STAGE3 TEST] Group household';p.description:='Temporary synthetic HTTP test fixture';p.starting_job_id:=null;
          INSERT INTO public.personas SELECT p.*;
          SELECT string_agg(quote_ident(attname),',' ORDER BY attnum) INTO columns_sql FROM pg_attribute WHERE attrelid='public.jobs'::regclass AND attnum>0 AND NOT attisdropped AND attgenerated='' AND attidentity='';
          FOR j IN SELECT * FROM public.jobs WHERE version_id='{BILLS_VERSION}' AND is_active AND is_approved AND NOT needs_english_skills AND NOT needs_computer_skills ORDER BY job_id LIMIT 2 LOOP
            j.job_id:=gen_random_uuid();j.version_id:='{self.edition}';
            EXECUTE format('INSERT INTO public.jobs (%s) SELECT %s FROM jsonb_populate_record(NULL::public.jobs,$1)',columns_sql,columns_sql) USING to_jsonb(j);
          END LOOP;
          SELECT category_id INTO STRICT category FROM public.categories LIMIT 1;
          FOR n IN 1..30 LOOP
            sid:=gen_random_uuid();
            INSERT INTO public.scenarios(scenario_id,version_id,title,description,default_day,category_id,persona_intent,schedule_type)
            VALUES(sid,'{self.edition}','[STAGE3 TEST] Decision '||lpad(n::text,2,'0'),'Temporary synthetic group API fixture',null,category,'{self.fixture_persona}','non_scheduled');
            INSERT INTO public.choices(choice_id,scenario_id,version_id,choice_text,balance_change,response_text,next_scenario_id)
            VALUES(gen_random_uuid(),sid,'{self.edition}','Fixture option A',0,'Fixture result',null),(gen_random_uuid(),sid,'{self.edition}','Fixture option B',0,'Fixture result',null);
          END LOOP;
        END $$;
        UPDATE public.content_versions SET status='published',published_at=clock_timestamp() WHERE version_id='{self.edition}';
        COMMIT;""")

    def anonymous_group(self):
        self.group_fixture()
        host = self.actors['anonymous']
        member = self.actor('anonymous_member')
        session = self.rpc('configure_host_group_session', {'p_create': True, 'p_decision_duration_seconds': 60, 'p_cac_support_enabled': False}, host)
        gid = session['sessionId']
        self.groups.add(gid)
        self.evidence()
        assert session['versionId'] == self.edition
        joined = self.rpc('join_group_session', {'p_code': session['joinCode']}, member)
        assert joined['participantId']
        self.rpc('update_group_participant_setup', {'p_session_id': gid, 'p_persona_id': self.fixture_persona, 'p_ready': True}, member)
        state = self.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'start'}, host)
        assert state.get('roundType') == 'job', state.get('error')
        assert state['sharedHouseholdId'] == self.fixture_persona
        self.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'next'}, member, denied=True)
        # Two attempts: current clothes first, then purchase on reapplication.
        prior_job = None
        for attempt in range(2):
            player = self.rpc('get_group_session_state', {'p_session_id': gid}, member)
            if prior_job:
                rejected = self.rpc('submit_group_job_vote', {'p_session_id': gid, 'p_job_id': prior_job}, member)
                assert rejected.get('error') == 'That job is not available.'
            job = next(j for j in player['jobs'] if j['jobId'] != prior_job)
            prior_job = job['jobId']
            vote = self.rpc('submit_group_job_vote', {'p_session_id': gid, 'p_job_id': job['jobId']}, member)
            assert vote.get('selectedJobId') == job['jobId'], vote.get('error')
            self.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'end_voting'}, host)
            state = self.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'next'}, host)
            option = 'current' if attempt == 0 else 'purchase'
            self.rpc('submit_group_employment_vote', {'p_session_id': gid, 'p_option_id': option}, member)
            self.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'end_voting'}, host)
            state = self.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'next'}, host)
            assert state['interviewHired'] is (attempt == 1)
            state = self.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'next'}, host)
        assert state['roundType'] == 'scenario'
        for day in range(1, 31):
            player = self.rpc('get_group_session_state', {'p_session_id': gid}, member)
            assert player['currentDay'] == day
            choice = player['question']['choices'][0]['choiceId']
            vote = self.rpc('submit_group_vote', {'p_session_id': gid, 'p_choice_id': choice}, member)
            assert 'error' not in vote, vote.get('error')
            self.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'end_voting'}, host)
            state = self.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'next'}, host)
        assert state['status'] == 'closed' and state['roundState'] == 'completed'
        self.refresh(member)
        assert self.rpc('get_group_session_state', {'p_session_id': gid}, member)['roundState'] == 'completed'

    def cleanup(self):
        for actor in self.actors.values():
            try:
                self.request('/auth/v1/logout?scope=global', {}, actor)
            except Exception as error:
                print('Cleanup sign-out failed; deleting tracked local Auth identity:', type(error).__name__, flush=True)
        ids = ','.join("'" + str(uuid.UUID(a['id'])) + "'" for a in self.actors.values())
        if ids:
            # Restrict deletion to identities created by this process. Never delete by email prefix.
            sql(f"""BEGIN;
            DELETE FROM public.group_sessions WHERE host_user_id IN ({ids});
            DELETE FROM public.player_responses WHERE playthrough_id IN (SELECT playthrough_id FROM public.playthroughs WHERE owner_user_id IN ({ids}));
            DELETE FROM public.playthrough_expenses WHERE playthrough_id IN (SELECT playthrough_id FROM public.playthroughs WHERE owner_user_id IN ({ids}));
            DELETE FROM public.playthroughs WHERE owner_user_id IN ({ids});
            DELETE FROM public.cac_staff WHERE user_id IN ({ids});
            DELETE FROM auth.users WHERE id IN ({ids});
            COMMIT;""")
        sql(f"""BEGIN;
        UPDATE public.content_versions SET status='draft',published_at=null WHERE version_id='{self.edition}';
        DELETE FROM public.choices WHERE version_id='{self.edition}';
        DELETE FROM public.scenarios WHERE version_id='{self.edition}';
        DELETE FROM public.jobs WHERE version_id='{self.edition}';
        DELETE FROM public.personas WHERE version_id='{self.edition}';
        DELETE FROM public.content_versions WHERE version_id='{self.edition}';
        COMMIT;""")
        assert self.fingerprints() == self.before, 'Existing data or test-created leftovers changed final fingerprints'
        assert self.schema() == self.schema_before, 'Application definitions changed'
        self.results.append({'case': 'cleanup and preservation of all existing application/Auth-user records and definitions', 'result': 'passed local database verification'})
        self.evidence()
        print('PASS: scoped cleanup; original database/user fingerprints and function/policy/trigger definitions unchanged', flush=True)

    def individual_cases(self):
        print('PASS: genuine Auth sessions and active staff provisioning', flush=True)
        self.check('anonymous individual lifecycle: employment, decisions, Pay/Ignore, completion, refresh and replay', lambda: self.lifecycle(self.actors['anonymous']))
        self.check('staff individual lifecycle under original Auth UUID: employment, decisions, bills, completion, refresh and replay', lambda: self.lifecycle(self.actors['staff_a']))
        self.check('second staff refresh, same-request receipt retry, termination and dashboard API boundary', self.staff_restore)
        self.check('staff cross-owner REST and RPC denial', self.cross_owner)
        self.check('revocation with unchanged genuine JWT and refreshed session', self.revocation)
        self.check('staff cannot create/join/read/vote as group participants', self.staff_group_denial)
        self.check('anonymous group host/member setup, employment, voting, 30-day completion and restoration', self.anonymous_group)

    def run(self):
        try:
            group_only = '--group-only' in sys.argv
            self.setup(group_only)
            if group_only:
                self.check('anonymous group host/member setup, employment, voting, 30-day completion and restoration', self.anonymous_group)
            else:
                self.individual_cases()
        except Exception as error:
            self.results.append({'case': 'setup/dependent verification', 'result': 'failed', 'cause': str(error)})
            print('FAIL: setup/dependent verification:', str(error), flush=True)
        finally:
            try:
                self.cleanup()
            except Exception as error:
                self.results.append({'case': 'cleanup/preservation', 'result': 'failed', 'cause': str(error)})
                self.evidence()
                print('FAIL: cleanup/preservation:', str(error), flush=True)
        print('Private evidence:', self.folder, flush=True)
        if any(r['result'] == 'failed' for r in self.results):
            raise SystemExit(1)


if __name__ == '__main__':
    Harness().run()
