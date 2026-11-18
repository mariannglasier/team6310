#!/usr/bin/env python3
"""Publication Auth/API verification, fixed isolated LOCAL stack only.
--preflight verifies Stage 2 before publication code is installed.
Synthetic fixture content only; no pre-existing content is written.
"""
from concurrent.futures import ThreadPoolExecutor
import subprocess
import time
import argparse
from pathlib import Path
import uuid
import test_staff_individual_local_api as local
from test_cms_personas_local_api import history_digest
from cms_publication_test_support import cleanup
local.DB = ['docker', '--host', 'unix:///var/run/docker.sock', 'exec', '-i',
            'supabase_db_team6310-phase2-verification', 'psql', '-U', 'postgres', '-XAtq', '-v', 'ON_ERROR_STOP=1']
sql = local.sql
ROOT = Path(__file__).resolve().parents[1]


def canonical_journeys(h, edition, staff, suffix, expected_balance, replay=False, minimal=False):
    bundle = h.rpc('cms_read_draft', {'p_version': edition}, staff) if suffix == 'published' else None
    if bundle:
        personas, jobs = bundle['personas'], bundle['jobs']
    else:
        personas = h.request('/rest/v1/personas?select=*&version_id=eq.' + edition)
        jobs = h.request('/rest/v1/jobs?select=*&version_id=eq.' + edition + '&order=job_id')
    actor = h.actor('publication-player-' + suffix)
    pid = personas[0]['persona_id']
    def individual(replay_of=None):
        rid = h.rpc('start_individual_playthrough', {'p_persona_id': pid}, actor)
        h.runs.add(rid)
        assert h.row(rid, actor)['version_id'] == edition
        decisions = []
        for _ in range(180):
            snapshot = h.snapshot(rid, actor)
            row = snapshot['run']
            stage = row['employment_state']['stage']
            if stage == 'complete':
                break
            if stage == 'uninitialized':
                h.action(rid, actor, 'initialize', {'replayOf': replay_of} if replay_of else {})
            elif stage == 'board':
                if replay_of and not row['employment_state']['prepared']:
                    h.action(rid, actor, 'prepare')
                else:
                    h.action(rid, actor, 'apply', {'jobId': jobs[0]['job_id']})
            elif stage == 'reapply':
                h.action(rid, actor, 'apply', {'jobId': jobs[1]['job_id']})
            elif stage == 'interview':
                h.action(rid, actor, 'interview', {'choice': 'cac' if replay_of else 'current' if row['current_day'] == 2 else 'purchase'})
            elif stage == 'day':
                for bill in snapshot['bills']:
                    if bill['due_day'] == row['current_day'] and not bill['paid_at'] and not bill['ignored_at']:
                        h.rpc('pay_bill', {'p_run_id': rid, 'p_occurrence_id': bill['playthrough_expense_id']}, actor)
                if row['current_scenario_id']:
                    sid = row['current_scenario_id']
                    choices = h.request('/rest/v1/choices?select=choice_id&scenario_id=eq.' + sid, actor=actor)
                    body = {'p_run_id': rid, 'p_scenario_id': sid, 'p_choice_id': choices[0]['choice_id']}
                    h.rpc('submit_scenario_decision', body, actor)
                    assert h.rpc('get_event_recap_facts', {'p_run_id': rid, 'p_event_key': sid}, actor) == []
                    assert h.rpc('restore_scenario_decision', {'p_run_id': rid, 'p_scenario_id': sid}, actor)['response_count'] == 1
                    decisions.append(sid)
                h.action(rid, actor, 'continue')
            else:
                h.action(rid, actor, 'continue')
        else:
            raise AssertionError('Individual run did not complete')
        final = h.snapshot(rid, actor)
        assert final['run']['status'] == 'completed' and final['run']['current_day'] == 30
        if not replay_of:
            assert final['run']['current_balance'] == expected_balance, final['run']['current_balance']
        if minimal:
            assert not decisions, 'No optional scenario or tax content is required'
        else:
            tax = next(s['scenario_id'] for s in (bundle['scenarios'] if bundle else h.request('/rest/v1/scenarios?select=*&version_id=eq.' + edition)) if s['title'] == 'Configured tax')
            assert decisions.count(tax) == 1
        h.refresh(actor)
        assert final == h.snapshot(rid, actor)
        return rid
    rid = individual()
    if replay:
        individual(rid)
    for support in ([False, True] if replay else [False]):
        host = h.actor('publication-host-' + suffix + str(support))
        member = h.actor('publication-member-' + suffix + str(support))
        session = h.rpc('configure_host_group_session', {'p_create': True, 'p_decision_duration_seconds': 120, 'p_cac_support_enabled': support}, host)
        gid = session['sessionId']; h.groups.add(gid)
        assert session['versionId'] == edition, 'Both entry points must consume the same canonical published edition'
        h.rpc('join_group_session', {'p_code': session['joinCode']}, member)
        h.rpc('update_group_participant_setup', {'p_session_id': gid, 'p_persona_id': pid, 'p_ready': True}, member)
        state = h.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'start'}, host)
        if minimal:
            assert 'error' in state, 'Known group 30-question incompatibility should be reproduced, not bypassed'
            return rid, gid
        assert 'error' not in state, state.get('error')
        if support:
            h.rpc('submit_group_employment_vote', {'p_session_id': gid, 'p_option_id': 'prepare'}, member)
            h.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'end_voting'}, host)
            state = h.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'next'}, host)
        for attempt in range(2):
            player = h.rpc('get_group_session_state', {'p_session_id': gid}, member)
            h.rpc('submit_group_job_vote', {'p_session_id': gid, 'p_job_id': jobs[attempt]['job_id']}, member)
            h.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'end_voting'}, host)
            h.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'next'}, host)
            h.rpc('submit_group_employment_vote', {'p_session_id': gid, 'p_option_id': 'cac' if support else 'current' if attempt == 0 else 'purchase'}, member)
            h.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'end_voting'}, host)
            state = h.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'next'}, host)
            assert state['interviewHired'] is (support or attempt == 1)
            state = h.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'next'}, host)
            if support:
                break
        seen = []
        while state['status'] != 'closed':
            player = h.rpc('get_group_session_state', {'p_session_id': gid}, member)
            seen.append(player['question']['scenarioId'])
            h.rpc('submit_group_vote', {'p_session_id': gid, 'p_choice_id': player['question']['choices'][0]['choiceId']}, member)
            h.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'end_voting'}, host)
            state = h.rpc('control_group_session', {'p_session_id': gid, 'p_action': 'next'}, host)
            assert len(seen) <= 30
        assert len(seen) == 30 and state['roundState'] == 'completed'
        assert state['sharedBalance'] == (100 if support else 40), state['sharedBalance']
        h.refresh(member)
        assert h.rpc('get_group_session_state', {'p_session_id': gid}, member)['roundState'] == 'completed'
    return rid, gid


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--preflight', action='store_true')
    options = parser.parse_args()
    h = local.Harness()
    source = draft = None
    editions = []
    negative_editions = []
    minimal_editions = []
    schema_before = h.schema()
    rows_before = h.fingerprints()
    content_before = sql("SELECT md5(coalesce(jsonb_agg(to_jsonb(v) ORDER BY version_id),'[]')::text) FROM public.content_versions v")
    before = history_digest()
    try:
        staff = h.actor('publication-staff', staff=True)
        h.authorize(staff)
        outsider = h.actor('publication-outsider', staff=True)
        anonymous = h.actor('publication-anonymous')
        source = sql((ROOT / 'supabase/tests/fixtures/cms-publication-source.sql').read_text() + '\nSELECT pg_temp.publication_source();').splitlines()[-1]
        assert str(uuid.UUID(source)) == source
        editions.append(source)
        draft = h.rpc('cms_create_draft', {'p_source': source, 'p_name': 'Publication API disposable', 'p_request': str(uuid.uuid4())}, staff)
        editions.append(draft)
        def read():
            return h.rpc('cms_read_draft', {'p_version': draft}, staff)
        snapshot = read()
        report = h.rpc('cms_publication_preflight', {'p_version': draft}, staff)
        assert report['can_publish'], [r for r in report['findings'] if r['severity'] == 'blocker']
        assert report == h.rpc('cms_publication_preflight', {'p_version': draft}, staff)
        assert snapshot == read()
        for actor in [outsider, anonymous]:
            h.rpc('cms_publication_preflight', {'p_version': draft}, actor, denied=True)
        h.request('/rest/v1/rpc/cms_publication_preflight', {'p_version': draft}, allowed=(401, 403, 404))
        h.request('/rest/v1/content_versions?version_id=eq.' + draft, {'status': 'published'}, staff, method='PATCH', allowed=(401, 403))
        sql(f"UPDATE public.cac_staff SET active=false WHERE user_id='{staff['id']}'")
        h.rpc('cms_publication_preflight', {'p_version': draft}, staff, denied=True)
        sql(f"UPDATE public.cac_staff SET active=true WHERE user_id='{staff['id']}'")
        assert before == history_digest()
        print('PASS: Stage 2 genuine Auth/API deterministic read-only preflight, incomplete-copy safety, staff/nonstaff/anonymous/revoked boundaries and direct-write denial')
        if not options.preflight:
            staff2 = h.actor('publication-staff-2', staff=True)
            h.authorize(staff2)
            def publish_args(vid, actor=staff):
                review = h.rpc('cms_publication_preflight', {'p_version': vid}, actor)
                return {'p_version': vid, 'p_revision': review['revision'], 'p_request': str(uuid.uuid4()), 'p_validator': review['validator'], 'p_heads': review['heads']}
            # Older edition will become ineligible when the newer one is published.
            newer = h.rpc('cms_create_draft', {'p_source': source, 'p_name': 'Newer publication draft', 'p_request': str(uuid.uuid4())}, staff)
            editions.append(newer)
            request = publish_args(newer)
            for actor in [outsider, anonymous]:
                h.rpc('cms_publish_draft', request, actor, denied=True)
            stale = {**request, 'p_revision': request['p_revision'] + 1}
            assert h.request('/rest/v1/rpc/cms_publish_draft', stale, staff, allowed=(500,))['code'] == '40001'
            result = h.rpc('cms_publish_draft', request, staff)
            assert result == h.rpc('cms_publish_draft', request, staff)
            h.rpc('cms_publish_draft', request, staff2, denied=True)
            assert result['version_id'] == newer and result['published_by'] == staff['id']
            assert h.rpc('cms_read_draft', {'p_version': newer}, staff)['publication'] == result
            assert any(p['version_id'] == newer for p in h.rpc('cms_list_publications', {}, staff))
            h.rpc('cms_list_publications', {}, outsider, denied=True)
            assert all(d['version_id'] != newer for d in h.rpc('cms_list_drafts', {}, staff))
            old_report = h.rpc('cms_publication_preflight', {'p_version': draft}, staff)
            assert any(f['code'] == 'PUB-ORDER' for f in old_report['findings'])
            h.rpc('cms_publish_draft', publish_args(draft), staff, denied=True)
            recovery = {'p_version': draft, 'p_revision': 0, 'p_source': newer, 'p_name': 'Recovered publication draft', 'p_request': str(uuid.uuid4())}
            fresh = h.rpc('cms_recover_draft', recovery, staff)
            editions.append(fresh)
            assert fresh == h.rpc('cms_recover_draft', recovery, staff)
            assert h.rpc('cms_read_draft', {'p_version': fresh}, staff)['workspace']['source_version'] == newer
            # Actual concurrent publish/publish, then publish/edit, sharing locks.
            def overlap(bodies, global_gate=False):
                lock = subprocess.Popen(local.DB, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                gate = "SELECT 1 FROM pg_advisory_xact_lock(6310,1115)" if global_gate else f"SELECT 1 FROM cms_private.workspaces WHERE version_id='{fresh}' FOR UPDATE"
                lock.stdin.write(f"BEGIN; {gate}; SELECT pg_sleep(3); COMMIT;")
                lock.stdin.close()
                assert lock.stdout.readline().strip() == '1'
                with ThreadPoolExecutor(max_workers=2) as pool:
                    futures = [pool.submit(h.request, '/rest/v1/rpc/' + name, body, actor, allowed=(200, 400, 500)) for name, body, actor in bodies]
                    deadline = time.monotonic() + 1.5
                    waiting = 0
                    while time.monotonic() < deadline:
                        waiting = int(sql("SELECT count(*) FROM pg_stat_activity WHERE wait_event_type='Lock' AND (query LIKE '%cms_publish_draft%' OR query LIKE '%cms_save_job%' OR query LIKE '%cms_create_draft%')"))
                        if waiting >= 2:
                            break
                        time.sleep(.05)
                    assert waiting >= 2, 'Two real HTTP requests must overlap behind held locks'
                    answers = [f.result() for f in futures]
                lock.wait(timeout=10)
                assert lock.returncode == 0, lock.stderr.read()
                return answers
            a = publish_args(fresh)
            b = {**a, 'p_request': str(uuid.uuid4())}
            answers = overlap([('cms_publish_draft', a, staff), ('cms_publish_draft', b, staff2)])
            assert sum('published_at' in answer for answer in answers) == 1, answers
            assert sum('code' in answer for answer in answers) == 1, answers
            # New unpublished copy for publish versus job edit.
            concurrent = h.rpc('cms_create_draft', {'p_source': fresh, 'p_name': 'Concurrent publication draft', 'p_request': str(uuid.uuid4())}, staff)
            editions.append(concurrent)
            fresh = concurrent
            bundle = h.rpc('cms_read_draft', {'p_version': fresh}, staff)
            a = publish_args(fresh)
            edit = {'p_version': fresh, 'p_revision': a['p_revision'], 'p_request': str(uuid.uuid4()), 'p_job': bundle['jobs'][0]['job_id'], 'p_fields': {'description': 'Concurrent authored note'}}
            answers = overlap([('cms_publish_draft', a, staff), ('cms_save_job', edit, staff2)])
            assert sum('revision' in answer for answer in answers) == 1, answers
            assert sum(answer.get('code') == '40001' for answer in answers) == 1, answers
            assert before == history_digest()
            print('PASS: genuine publication/reopening/retry, overtaken rejection, fresh-latest recovery, authorization, overlapping publishers and publication versus job edit')
            allocation = overlap([('cms_create_draft', {'p_source': newer, 'p_name': 'Concurrent allocation ' + str(i), 'p_request': str(uuid.uuid4())}, actor) for i, actor in enumerate([staff, staff2])], global_gate=True)
            assert all(isinstance(vid, str) and str(uuid.UUID(vid)) == vid for vid in allocation)
            editions.extend(allocation)
            ids = ','.join("'" + vid + "'" for vid in allocation)
            assert sql(f'SELECT count(DISTINCT version_number)=2 FROM public.content_versions WHERE version_id IN ({ids})') == 't'
            print('PASS: simultaneous protected draft creation allocates distinct edition numbers under the shared publisher lock')
            previous_head = h.request('/rest/v1/content_versions?select=version_id&order=version_number.desc&limit=1')[0]['version_id']
            competing = [h.rpc('cms_create_draft', {'p_source': previous_head, 'p_name': 'Competing draft ' + str(i), 'p_request': str(uuid.uuid4())}, staff) for i in range(2)]
            editions.extend(competing)
            requests = [publish_args(vid) for vid in competing]
            answers = overlap([('cms_publish_draft', requests[0], staff), ('cms_publish_draft', requests[1], staff2)], global_gate=True)
            assert sum('published_at' in answer for answer in answers) == 1, answers
            assert sum(answer.get('code') == '40001' for answer in answers) == 1, answers
            print('PASS: competing distinct drafts serialize on publication heads; exactly one publishes and the other requires renewed review')
            canonical = h.request('/rest/v1/content_versions?select=version_id&order=version_number.desc&limit=1')[0]['version_id']
            canonical_journeys(h, canonical, staff, 'published', 40, replay=True)
            print('PASS: genuine Day-30 individual/no-support and CAC replay plus both group support modes consume the same CMS-published fixture edition; tax occurs once and refresh restores committed state')
            # Demonstrate, rather than conceal, positive-income/bill group divergence.
            script = (ROOT / 'supabase/tests/fixtures/cms-publication-source.sql').read_text()
            script = script.replace("2026,0,40", "2026,1,40")
            script = script.replace(" UPDATE public.content_versions SET status='published'", " INSERT INTO public.persona_expenses(persona_id,version_id,name,amount,first_due_day,late_fee_amount) VALUES(p,v,'Synthetic bill',7,6,1);\n UPDATE public.content_versions SET status='published'")
            negative_source = sql(script + '\nSELECT pg_temp.publication_source();').splitlines()[-1]
            negative_editions.append(negative_source)
            canonical_journeys(h, negative_source, staff, 'divergence', 153)
            negative = h.rpc('cms_create_draft', {'p_source': negative_source, 'p_name': 'Group incompatibility fixture', 'p_request': str(uuid.uuid4())}, staff)
            negative_editions.append(negative)
            failing = h.rpc('cms_publication_preflight', {'p_version': negative}, staff)
            assert failing['can_publish']
            assert not any(f['code'] == 'PUB-SUPPORTED-MODE-FAILURE' for f in failing['findings'])
            h.rpc('cms_publish_draft', publish_args(negative), staff)
            assert h.rpc('cms_read_draft', {'p_version': negative}, staff)['edition']['status'] == 'published'
            print('PASS: known group failure reproduced: canonical individual final balance 153 versus group 40; canonical publication remains allowed without group-only content requirements')

            # Minimum-only content uses the same normal protected publication.
            minimum_script = (ROOT / 'supabase/tests/fixtures/cms-publication-source.sql').read_text().replace('FOR i IN 1..31 LOOP', 'FOR i IN 1..0 LOOP')
            minimum_source = sql(minimum_script + '\nSELECT pg_temp.publication_source();').splitlines()[-1]
            minimal_editions.append(minimum_source)
            minimum = h.rpc('cms_create_draft', {'p_source': minimum_source, 'p_name': 'Minimum-only edition', 'p_request': str(uuid.uuid4())}, staff)
            minimal_editions.append(minimum)
            review = h.rpc('cms_publication_preflight', {'p_version': minimum}, staff)
            assert review['can_publish'] and not review['findings']
            h.rpc('cms_publish_draft', publish_args(minimum), staff)
            canonical_journeys(h, minimum, staff, 'minimum', 40, minimal=True)
            print('PASS: one-persona/two-job edition publishes without scenarios, bills, facts or tax, completes individual Day 30, and reproduces group startup incompatibility without blocking publication')

    finally:
        if minimal_editions:
            cleanup(minimal_editions)
        if negative_editions:
            cleanup(negative_editions)
        if editions:
            cleanup(editions)
        if h.actors:
            ids = ','.join("'" + a['id'] + "'" for a in h.actors.values())
            sql(f'DELETE FROM public.cac_staff WHERE user_id IN ({ids}); DELETE FROM auth.users WHERE id IN ({ids});')
        assert before == history_digest()
        assert schema_before == h.schema(), 'Guards/functions/policies must be unchanged by test teardown'
        assert rows_before == h.fingerprints(), 'Pre-existing content, Auth users and gameplay rows must remain unchanged'
        assert content_before == sql("SELECT md5(coalesce(jsonb_agg(to_jsonb(v) ORDER BY version_id),'[]')::text) FROM public.content_versions v")
        print('PASS: disposable fixture cleanup; pre-existing editions, historical gameplay and guard definitions unchanged')


if __name__ == '__main__':
    main()
