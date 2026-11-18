#!/usr/bin/env python3
"""Persona Stage 1: genuine Auth/HTTP and concurrent saves, fixed LOCAL stack only.

Creates disposable accounts/source/draft; removes only tracked fixtures in finally.
Never reads hosted credentials. Uses the existing local API harness (no setup/run).
"""
from concurrent.futures import ThreadPoolExecutor
import json
import subprocess
import time
import uuid

import test_staff_individual_local_api as local

local.DB = ['docker', '--host', 'unix:///var/run/docker.sock', 'exec', '-i',
            'supabase_db_team6310-phase2-verification', 'psql', '-U', 'postgres',
            '-XAtq', '-v', 'ON_ERROR_STOP=1']
sql = local.sql


def literal(value):
    return "'" + str(value).replace("'", "''") + "'"


def history_digest():
    tables = ['playthroughs', 'player_responses', 'playthrough_expenses',
              'group_sessions', 'group_participants', 'group_votes']
    return sql('SELECT jsonb_build_array(' + ','.join(
        "(SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text),'[]')::text) FROM public." + t + ' r)'
        for t in tables) + ')')


def main():
    h = local.Harness()
    draft = None
    source, persona, expense, scenario = [str(uuid.uuid4()) for _ in range(4)]
    before = history_digest()
    try:
        staff = h.actor('persona-staff', staff=True)
        h.authorize(staff)
        staff2 = h.actor('persona-staff-2', staff=True)
        h.authorize(staff2)
        outsider = h.actor('persona-nonstaff', staff=True)
        anonymous = h.actor('persona-anonymous')
        sql(f"""BEGIN;
          INSERT INTO public.content_versions(version_id,version_number,status) VALUES('{source}',1,'draft');
          INSERT INTO public.personas(persona_id,version_id,name,description,general_starting_balance,weekly_income,has_english_skills,has_computer_skills)
            VALUES('{persona}','{source}','API source','Source details',100,0,true,false);
          INSERT INTO public.scenarios(scenario_id,version_id,title,description,persona_intent,category_id,schedule_type,default_day)
            VALUES('{scenario}','{source}','API scheduled','Fixture','{persona}',(SELECT category_id FROM public.categories LIMIT 1),'scheduled',10);
          INSERT INTO public.persona_expenses(expense_id,persona_id,version_id,name,amount,first_due_day,late_fee_amount)
            VALUES('{expense}','{persona}','{source}','API source expense',12.25,6,0);
          UPDATE public.content_versions SET status='published',published_at=now() WHERE version_id='{source}';
          COMMIT;""")
        source_before = sql(f"SELECT to_jsonb(p)::text || (SELECT jsonb_agg(to_jsonb(e))::text FROM public.persona_expenses e WHERE version_id='{source}') FROM public.personas p WHERE persona_id='{persona}'")
        draft = h.rpc('cms_create_draft', {'p_source': source, 'p_name': 'Persona API disposable', 'p_request': str(uuid.uuid4())}, staff)

        def read(actor=staff):
            return h.rpc('cms_read_draft', {'p_version': draft}, actor)

        def bundle(pid, fields, expenses):
            return {'p_version': draft, 'p_revision': read()['workspace']['revision'],
                    'p_request': str(uuid.uuid4()), 'p_persona': pid,
                    'p_fields': fields, 'p_expenses': expenses}

        def owned(pid):
            keys = ['expense_id', 'name', 'amount', 'first_due_day', 'repeat_interval_days', 'late_fee_amount']
            return [{k: e[k] for k in keys} for e in read()['expenses'] if e['persona_id'] == pid]

        initial = read()
        pid = initial['personas'][0]['persona_id']
        assert pid != persona and initial['expenses'][0]['expense_id'] != expense
        assert initial['expenses'][0]['persona_id'] == pid
        assert initial['personas'][0]['description'] == 'Source details'
        assert all(k in initial for k in ['choices', 'facts', 'scenarios'])
        fields = {'name': 'Created via API', 'description': 'Saved persona details',
                  'general_starting_balance': '200.05', 'has_english_skills': False, 'has_computer_skills': True}
        row = {'expense_id': None, 'client_key': 'first', 'name': 'New expense', 'amount': '1.25',
               'first_due_day': 2, 'repeat_interval_days': 7, 'late_fee_amount': '0.50'}
        request = bundle(None, fields, [row])
        saved = h.rpc('cms_save_persona_bundle', request, staff)
        assert saved == h.rpc('cms_save_persona_bundle', request, staff)
        np = saved['persona_id']
        fresh = next(p for p in read(staff2)['personas'] if p['persona_id'] == np)
        assert fresh['weekly_income'] == 0 and fresh['starting_job_id'] is None
        original_id = owned(np)[0]['expense_id']
        edited = owned(np)
        edited[0]['amount'] = '2.50'
        h.rpc('cms_save_persona_bundle', bundle(np, {'description': 'Edited details'}, edited), staff2)
        assert owned(np)[0]['expense_id'] == original_id and owned(np)[0]['amount'] == 2.5
        assert saved == h.rpc('cms_save_persona_bundle', request, staff)
        h.rpc('cms_save_persona_bundle', request, staff2, denied=True)
        assert h.request('/rest/v1/rpc/cms_save_persona_bundle', {**request, 'p_request': str(uuid.uuid4())}, staff, allowed=(500,))['code'] == '40001'

        # Actual HTTP access controls, including table writes and revocation.
        for actor in [outsider, anonymous]:
            h.rpc('cms_read_draft', {'p_version': draft}, actor, denied=True)
            h.rpc('cms_save_persona_bundle', bundle(np, {}, owned(np)), actor, denied=True)
        h.request('/rest/v1/rpc/cms_save_persona_bundle', bundle(np, {}, owned(np)), allowed=(401, 403, 404))
        h.request('/rest/v1/personas?persona_id=eq.' + np, {'name': 'Forbidden'}, staff, method='PATCH', allowed=(401, 403))
        h.request('/rest/v1/persona_expenses?expense_id=eq.' + original_id, actor=staff, method='DELETE', allowed=(401, 403))
        sql(f"UPDATE public.cac_staff SET active=false WHERE user_id='{staff2['id']}'")
        h.rpc('cms_read_draft', {'p_version': draft}, staff2, denied=True)
        h.rpc('cms_save_persona_bundle', bundle(np, {}, owned(np)), staff2, denied=True)
        sql(f"UPDATE public.cac_staff SET active=true WHERE user_id='{staff2['id']}'")

        for changes in [{'weekly_income': 5}, {'starting_job_id': None}, {'general_starting_balance': '1.001'}]:
            h.rpc('cms_save_persona_bundle', bundle(np, changes, owned(np)), staff, denied=True)
        h.rpc('cms_save_persona_bundle', bundle(pid, {}, owned(np)), staff, denied=True)
        collision = owned(pid)
        collision[0]['first_due_day'] = 10
        snap = read()
        h.rpc('cms_save_persona_bundle', bundle(pid, {'name': 'Rollback'}, collision), staff, denied=True)
        assert snap == read()
        source_request = {**bundle(pid, {}, owned(pid)), 'p_version': source, 'p_persona': persona}
        assert h.request('/rest/v1/rpc/cms_save_persona_bundle', source_request, staff, allowed=(500,))['code'] == 'P0002'

        # Two HTTP requests overlap behind the same workspace lock. One must win.
        cat = initial['scenarios'][0]['category_id']
        sid = initial['scenarios'][0]['scenario_id']
        persona_request = bundle(np, {'name': 'Concurrent persona'}, owned(np))
        scenario_request = {'p_version': draft, 'p_revision': persona_request['p_revision'],
                            'p_request': str(uuid.uuid4()), 'p_scenario': sid, 'p_title': 'Concurrent scenario',
                            'p_description': 'Fixture', 'p_category': cat, 'p_persona': pid,
                            'p_schedule': 'scheduled', 'p_day': 10, 'p_choices': [], 'p_facts': []}
        lock = subprocess.Popen(local.DB, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        lock.stdin.write(f"BEGIN; SELECT 1 FROM cms_private.workspaces WHERE version_id='{draft}' FOR UPDATE; SELECT pg_sleep(3); COMMIT;")
        lock.stdin.close()
        assert lock.stdout.readline().strip() == '1', 'Workspace lock was not acquired'

        def save(name, body, actor):
            return h.request('/rest/v1/rpc/' + name, body, actor, allowed=(200, 500))

        with ThreadPoolExecutor(max_workers=2) as pool:
            a = pool.submit(save, 'cms_save_persona_bundle', persona_request, staff)
            b = pool.submit(save, 'cms_save_scenario_content', scenario_request, staff2)
            deadline = time.monotonic() + 1.5
            waiting = 0
            while time.monotonic() < deadline:
                waiting = int(sql("SELECT count(*) FROM pg_stat_activity WHERE wait_event_type='Lock' AND (query LIKE '%cms_save_persona_bundle%' OR query LIKE '%cms_save_scenario_content%')"))
                if waiting >= 2:
                    break
                time.sleep(.05)
            assert waiting >= 2, 'Both HTTP saves must overlap behind the held workspace lock'
            results = [a.result(), b.result()]
        lock.wait(timeout=10)
        assert lock.returncode == 0, lock.stderr.read()
        assert sum('revision' in r for r in results) == 1, results
        assert sum(r.get('code') == '40001' for r in results) == 1, results
        assert read()['workspace']['revision'] == persona_request['p_revision'] + 1

        h.rpc('cms_save_persona_bundle', bundle(np, {}, []), staff)
        assert not owned(np)
        assert source_before == sql(f"SELECT to_jsonb(p)::text || (SELECT jsonb_agg(to_jsonb(e))::text FROM public.persona_expenses e WHERE version_id='{source}') FROM public.personas p WHERE persona_id='{persona}'")
        assert before == history_digest()
        print('PASS: genuine local API copy/create/edit/delete/reopen, isolation, validation, authorization, revocation, retry and overlapping scenario/persona concurrency')
    finally:
        # Remove only explicitly tracked fixture content and new Auth identities.
        if draft:
            actor = h.actors['persona-staff']
            current = h.rpc('cms_read_draft', {'p_version': draft}, actor)
            h.request('/rest/v1/rpc/cms_delete_draft', {'p_version': draft, 'p_revision': current['workspace']['revision']}, actor, allowed=(200, 204))
        sql(f"""BEGIN;
          UPDATE public.content_versions SET status='draft',published_at=NULL WHERE version_id='{source}';
          DELETE FROM public.persona_expenses WHERE version_id='{source}';
          DELETE FROM public.scenarios WHERE version_id='{source}';
          DELETE FROM public.personas WHERE version_id='{source}';
          DELETE FROM public.content_versions WHERE version_id='{source}';
          COMMIT;""")
        if h.actors:
            ids = ','.join(literal(a['id']) for a in h.actors.values())
            sql(f'DELETE FROM public.cac_staff WHERE user_id IN ({ids}); DELETE FROM auth.users WHERE id IN ({ids});')
        assert before == history_digest()
        print('PASS: fixture cleanup; historical gameplay fingerprints unchanged')


if __name__ == '__main__':
    main()
