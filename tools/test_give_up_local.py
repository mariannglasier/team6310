#!/usr/bin/env python3
"""Two-connection races against the isolated local database, never hosted.

Requires the local synthetic bills/scenario fixtures and Give Up migration.
Creates uniquely owned test records and deletes only those records on exit.
"""
import json
import subprocess
import uuid

PSQL = ['docker', '--host', 'unix:///var/run/docker.sock', 'exec', '-i',
        'supabase_db_team6310-phase2-verification', 'psql', '-U', 'postgres',
        '-d', 'postgres', '-X', '-At', '-v', 'ON_ERROR_STOP=1']
OWNER = str(uuid.uuid4())
CLAIMS = json.dumps({'sub': OWNER, 'is_anonymous': True})
AUTH = f"SET LOCAL request.jwt.claims = '{CLAIMS}'; SET LOCAL ROLE authenticated;"


def sql(statement):
    result = subprocess.run(PSQL, input=statement, text=True, capture_output=True, check=True)
    return result.stdout.strip()


def action(run, kind, revision):
    return (f"public.submit_employment_action('{run}','{uuid.uuid4()}',"
            f"{revision},'{{\"type\":\"{kind}\"}}')")


def fixture(kind):
    persona = '[LOCAL TEST] Alex' if kind == 'scenario' else '[LOCAL TEST] Bills Alex'
    run = json.loads(sql(f"""BEGIN; {AUTH}
      SELECT to_json(public.start_individual_playthrough((SELECT persona_id
        FROM public.personas WHERE name='{persona}'))); COMMIT;""").splitlines()[-2])
    if kind != 'fresh':
        sql(f'BEGIN; {AUTH} SELECT {action(run, "initialize", 0)}; COMMIT;')
    if kind in ('pay', 'ignore'):
        sql(f"""UPDATE public.playthroughs SET current_day=(SELECT min(due_day)
          FROM public.playthrough_expenses WHERE playthrough_id='{run}'),
          employment_state=jsonb_set(employment_state,'{{stage}}','"day"')
          WHERE playthrough_id='{run}';""")
    elif kind == 'scenario':
        sql(f"""UPDATE public.playthroughs SET current_day=4,
          current_scenario_id='63100000-0000-4000-8000-000000000004',
          employment_state=jsonb_set(employment_state,'{{stage}}','"day"')
          WHERE playthrough_id='{run}';""")
    return run


def snapshot(run):
    return f"public.get_bill_snapshot('{run}')"


def race(run, first, second, second_succeeds):
    # First action owns the row lock before the competing connection starts.
    process = subprocess.Popen(PSQL, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE, text=True)
    process.stdin.write(f"""BEGIN; SET LOCAL statement_timeout='10s'; {AUTH}
      DO $$ BEGIN PERFORM {first}; END $$;
      SELECT {snapshot(run)};
      SELECT pg_sleep(0.7); COMMIT;
    """)
    process.stdin.close()
    committed = None
    for line in process.stdout:
        if line.startswith('{'):
            committed = json.loads(line)
            break
    assert committed, process.stderr.read()
    competing = subprocess.run(PSQL, input=f"""BEGIN;
      SET LOCAL statement_timeout='10s'; {AUTH}
      SELECT {second}; COMMIT;""", text=True, capture_output=True)
    process.stdout.read()
    error = process.stderr.read()
    assert process.wait(timeout=10) == 0, error
    assert (competing.returncode == 0) == second_succeeds, competing.stderr
    final = json.loads(sql(f"BEGIN; {AUTH} SELECT {snapshot(run)}; COMMIT;").splitlines()[-2])
    return committed, final


def main():
    sql(f"INSERT INTO auth.users(id,is_anonymous) VALUES('{OWNER}',true);")
    try:
        for kind in ('fresh', 'board', 'pay', 'ignore', 'scenario'):
            for end_first in (True, False):
                run = fixture(kind)
                end = action(run, 'end', 0 if kind == 'fresh' else 1)
                if kind in ('fresh', 'board'):
                    if kind == 'fresh':
                        other = action(run, 'initialize', 0)
                    else:
                        other = (f"public.submit_employment_action('{run}','{uuid.uuid4()}',1,"
                                 "jsonb_build_object('type','apply','jobId',(SELECT job_id"
                                 " FROM public.jobs WHERE version_id='63100000-0000-4000-8000-000000000800'"
                                 " AND is_active AND is_approved AND NOT needs_english_skills"
                                 " AND NOT needs_computer_skills ORDER BY job_id LIMIT 1)))")
                elif kind in ('pay', 'ignore'):
                    other = (f"public.{kind}_bill('{run}',(SELECT playthrough_expense_id"
                             f" FROM public.playthrough_expenses WHERE playthrough_id='{run}'"
                             ' ORDER BY due_day LIMIT 1))')
                else:
                    other = (f"public.submit_scenario_decision('{run}',"
                             "'63100000-0000-4000-8000-000000000004',"
                             "'63100000-0000-4000-8000-000000000041')")
                first, second = (end, other) if end_first else (other, end)
                succeeds = not end_first and kind in ('pay', 'ignore', 'scenario')
                before, after = race(run, first, second, succeeds)
                if not succeeds:
                    assert after == before, 'Rejected competing operation changed state'
                else:
                    assert after['run']['status'] == 'ended'
                    before_run, after_run = before.pop('run'), after.pop('run')
                    assert before == after, 'Ending changed bill/decision/financial totals'
                    for key in ('status', 'employment_state'):
                        before_run.pop(key)
                        after_run.pop(key)
                    assert before_run == after_run, 'Ending overwrote committed gameplay'
                print(f'PASS: {kind}, {"end first" if end_first else "gameplay first"}')
        run = fixture('fresh')
        end = action(run, 'end', 0)
        before, after = race(run, end, end, True)
        assert before == after, 'Concurrent identical receipt retry changed state'
        print('PASS: concurrent identical end request recovers its receipt')
    finally:
        # Only synthetic records belonging to this invocation are removed.
        sql(f"""BEGIN;
          DELETE FROM public.player_responses WHERE playthrough_id IN
            (SELECT playthrough_id FROM public.playthroughs WHERE owner_user_id='{OWNER}');
          DELETE FROM public.playthrough_expenses WHERE playthrough_id IN
            (SELECT playthrough_id FROM public.playthroughs WHERE owner_user_id='{OWNER}');
          DELETE FROM public.playthroughs WHERE owner_user_id='{OWNER}';
          DELETE FROM auth.users WHERE id='{OWNER}'; COMMIT;""")


if __name__ == '__main__':
    main()
