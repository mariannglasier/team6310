#!/usr/bin/env python3
"""Real local Auth/HTTP CMS jobs, shared concurrency and source isolation.

Fixed verification stack only. Disposable fixtures removed in finally.
"""
from concurrent.futures import ThreadPoolExecutor
import subprocess
import time
import uuid
import test_staff_individual_local_api as local
from test_cms_personas_local_api import history_digest

local.DB = ['docker', '--host', 'unix:///var/run/docker.sock', 'exec', '-i',
            'supabase_db_team6310-phase2-verification', 'psql', '-U', 'postgres',
            '-XAtq', '-v', 'ON_ERROR_STOP=1']
sql = local.sql


def main():
    h = local.Harness()
    draft = None
    source, job, persona = [str(uuid.uuid4()) for _ in range(3)]
    before = history_digest()
    try:
        staff = h.actor('job-staff', staff=True)
        h.authorize(staff)
        staff2 = h.actor('job-staff-2', staff=True)
        h.authorize(staff2)
        outsider = h.actor('job-nonstaff', staff=True)
        anonymous = h.actor('job-anonymous')
        sql(f"""BEGIN;
          INSERT INTO public.content_versions(version_id,version_number,status) VALUES('{source}',1,'draft');
          INSERT INTO public.jobs(job_id,version_id,soc_code,title,median_hourly_wage,hours_per_week,simulation_requirements)
            VALUES('{job}','{source}','11-1111','API legacy job',10.25,37.5,'{{"notes":{{"legacy":true}},"preserved":[1,2]}}');
          INSERT INTO public.personas(persona_id,version_id,name,weekly_income,starting_job_id)
            VALUES('{persona}','{source}','Job API household',9,'{job}');
          UPDATE public.content_versions SET status='published',published_at=now() WHERE version_id='{source}'; COMMIT;""")
        source_before = sql(f"SELECT to_jsonb(j)::text FROM public.jobs j WHERE version_id='{source}'")
        draft = h.rpc('cms_create_draft', {'p_source': source, 'p_name': 'Job API disposable', 'p_request': str(uuid.uuid4())}, staff)

        def read(actor=staff):
            return h.rpc('cms_read_draft', {'p_version': draft}, actor)

        def save(jid, fields):
            return {'p_version': draft, 'p_revision': read()['workspace']['revision'], 'p_request': str(uuid.uuid4()), 'p_job': jid, 'p_fields': fields}

        def deletion(jid):
            return {k: v for k, v in save(jid, {}).items() if k != 'p_fields'}

        initial = read()
        jid = initial['jobs'][0]['job_id']
        pid = initial['personas'][0]['persona_id']
        assert jid != job and initial['personas'][0]['starting_job_id'] == jid
        assert initial['jobs'][0]['weekly_gross_income'] == 384.38
        request = save(jid, {'median_hourly_wage': '12.34', 'hours_per_week': '30.25', 'requirements_notes': 'Authored note'})
        result = h.rpc('cms_save_job', request, staff)
        assert result == h.rpc('cms_save_job', request, staff)
        updated = read(staff2)
        row = updated['jobs'][0]
        assert row['job_id'] == jid and row['weekly_gross_income'] == 373.29
        assert row['simulation_requirements'] == {'notes': 'Authored note', 'preserved': [1, 2]}
        assert updated['personas'][0]['weekly_income'] == 9
        assert updated['personas'][0]['starting_job_id'] == jid
        h.rpc('cms_save_job', request, staff2, denied=True)
        stale = {**request, 'p_request': str(uuid.uuid4())}
        assert h.request('/rest/v1/rpc/cms_save_job', stale, staff, allowed=(500,))['code'] == '40001'
        snapshot = read()
        for fields in [{'median_hourly_wage': '1.001'}, {'hours_per_week': '0'}, {'weekly_gross_income': 10}, {'is_active': True}, {'wage_year': 2101}]:
            h.rpc('cms_save_job', save(jid, fields), staff, denied=True)
        h.rpc('cms_save_job', save(job, {'title': 'Forbidden source'}), staff, denied=True)
        h.rpc('cms_delete_job', deletion(jid), staff, denied=True)
        assert snapshot == read()
        for actor in [outsider, anonymous]:
            h.rpc('cms_read_draft', {'p_version': draft}, actor, denied=True)
            h.rpc('cms_save_job', save(jid, {'title': 'Forbidden'}), actor, denied=True)
            h.rpc('cms_delete_job', deletion(jid), actor, denied=True)
        h.request('/rest/v1/rpc/cms_save_job', save(jid, {}), allowed=(401, 403, 404))
        h.request('/rest/v1/jobs?job_id=eq.' + jid, {'title': 'Forbidden'}, staff, method='PATCH', allowed=(401, 403))
        sql(f"UPDATE public.cac_staff SET active=false WHERE user_id='{staff2['id']}'")
        h.rpc('cms_save_job', save(jid, {}), staff2, denied=True)
        sql(f"UPDATE public.cac_staff SET active=true WHERE user_id='{staff2['id']}'")
        new_fields = {'soc_code': '11-2222', 'title': 'Created job', 'area_code': 'A', 'area_name': 'Area', 'geography_level': 'STATE', 'hours_per_week': '40', 'wage_source_url': 'Source'}
        creation = save(None, new_fields)
        created = h.rpc('cms_save_job', creation, staff)
        assert created == h.rpc('cms_save_job', creation, staff)
        nj = created['job_id']
        newrow = next(j for j in read()['jobs'] if j['job_id'] == nj)
        assert newrow['median_hourly_wage'] is None and newrow['weekly_gross_income'] is None
        assert newrow['is_active'] is False and newrow['is_approved'] is False

        # Two different editor saves overlap on the SAME workspace revision.
        job_request = save(nj, {'title': 'Concurrent job'})
        persona_request = {'p_version': draft, 'p_revision': job_request['p_revision'], 'p_request': str(uuid.uuid4()), 'p_persona': pid, 'p_fields': {'description': 'Concurrent persona'}, 'p_expenses': []}
        lock = subprocess.Popen(local.DB, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        lock.stdin.write(f"BEGIN; SELECT 1 FROM cms_private.workspaces WHERE version_id='{draft}' FOR UPDATE; SELECT pg_sleep(3); COMMIT;")
        lock.stdin.close()
        assert lock.stdout.readline().strip() == '1'
        with ThreadPoolExecutor(max_workers=2) as pool:
            a = pool.submit(h.request, '/rest/v1/rpc/cms_save_job', job_request, staff, allowed=(200, 500))
            b = pool.submit(h.request, '/rest/v1/rpc/cms_save_persona_bundle', persona_request, staff2, allowed=(200, 500))
            deadline = time.monotonic() + 1.5
            waiting = 0
            while time.monotonic() < deadline:
                waiting = int(sql("SELECT count(*) FROM pg_stat_activity WHERE wait_event_type='Lock' AND (query LIKE '%cms_save_job%' OR query LIKE '%cms_save_persona_bundle%')"))
                if waiting >= 2:
                    break
                time.sleep(.05)
            assert waiting >= 2, 'Both requests must overlap behind the workspace lock'
            results = [a.result(), b.result()]
        lock.wait(timeout=10)
        assert lock.returncode == 0, lock.stderr.read()
        assert sum('revision' in r for r in results) == 1, results
        assert sum(r.get('code') == '40001' for r in results) == 1, results
        assert read()['workspace']['revision'] == job_request['p_revision'] + 1
        remove = deletion(nj)
        removed = h.rpc('cms_delete_job', remove, staff)
        assert removed == h.rpc('cms_delete_job', remove, staff)
        assert not any(j['job_id'] == nj for j in read()['jobs'])
        assert source_before == sql(f"SELECT to_jsonb(j)::text FROM public.jobs j WHERE version_id='{source}'")
        assert before == history_digest()
        print('PASS: real local Auth/API jobs copy/create/edit/reopen, generated income, legacy JSON, source isolation, persona references, deletion, authorization, revocation, retries and overlapping job/persona concurrency')
    finally:
        if draft:
            current = h.rpc('cms_read_draft', {'p_version': draft}, h.actors['job-staff'])
            h.request('/rest/v1/rpc/cms_delete_draft', {'p_version': draft, 'p_revision': current['workspace']['revision']}, h.actors['job-staff'], allowed=(200, 204))
        sql(f"""BEGIN; UPDATE public.content_versions SET status='draft',published_at=NULL WHERE version_id='{source}';
            DELETE FROM public.personas WHERE version_id='{source}'; DELETE FROM public.jobs WHERE version_id='{source}';
            DELETE FROM public.content_versions WHERE version_id='{source}'; COMMIT;""")
        if h.actors:
            ids = ','.join("'" + a['id'] + "'" for a in h.actors.values())
            sql(f'DELETE FROM public.cac_staff WHERE user_id IN ({ids}); DELETE FROM auth.users WHERE id IN ({ids});')
        assert before == history_digest()
        print('PASS: cleanup; historical gameplay fingerprints unchanged')


if __name__ == '__main__':
    main()
