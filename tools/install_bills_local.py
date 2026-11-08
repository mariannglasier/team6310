#!/usr/bin/env python3
"""Install reviewed bills SQL into the fixed disposable local stack; never hosted."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
DOCKER = ['docker', '--host', 'unix:///var/run/docker.sock']
CONTAINER = 'supabase_db_team6310-phase2-verification'
MIGRATIONS = [
    '20261108010000_bill_schedule_foundation.sql',
    '20261108020000_bill_gameplay.sql',
    '20261108030000_bill_financial_snapshot.sql',
]
FUNCTIONS = [
    'guard_bill_definition()', 'guard_bill_occurrence_snapshot()', 'guard_bill_run_marker()',
    'initialize_fresh_bill_schedule()', 'pay_bill(uuid,uuid)', 'ignore_bill(uuid,uuid)',
    'guard_bill_advancement()', 'guard_scenario_bill_collision()', 'guard_bill_publication()',
    'get_bill_snapshot(uuid)',
]
TRIGGERS = [
    'persona_expenses_guard_bill_definition', 'playthrough_expenses_guard_bill_snapshot',
    'playthroughs_guard_bill_marker', 'initialize_fresh_bill_schedule', 'z_bill_advancement',
    'scenarios_guard_bill_collision', 'content_versions_guard_bill_publication',
]
SNAPSHOT = """select jsonb_build_object(
 'runs',(select md5(coalesce(jsonb_agg(to_jsonb(p)-'expenses_initialized_at' order by playthrough_id)::text,'')) from public.playthroughs p),
 'responses',(select md5(coalesce(jsonb_agg(to_jsonb(r) order by response_id)::text,'')) from public.player_responses r),
 'gameplay_functions',(select md5(string_agg(pg_get_functiondef(oid),'' order by proname)) from pg_proc
 where pronamespace='public'::regnamespace and proname in ('submit_employment_action','mark_fresh_employment_run',
 'valid_employment_document','submit_scenario_decision','restore_scenario_decision','manage_scheduled_scenario_progression')))
"""


def migration_body(text):
    # One outer transaction encloses every stage and any approved fixture archive.
    body, begin_count = re.subn(r'^BEGIN;\s*$', '', text, count=1, flags=re.M)
    body, end_count = re.subn(r'^COMMIT;\s*$', '', body, count=1, flags=re.M)
    if begin_count != 1 or end_count != 1:
        raise ValueError('Bills migration transaction shape changed; review the local installer.')
    return body


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Read-only readiness check')
    parser.add_argument('--archive-employment-fixture', action='store_true',
                        help='Explicitly back up/remove only the known old Local rent test definition')
    args = parser.parse_args()
    if args.check and args.archive_employment_fixture:
        parser.error('--check never archives or changes data')
    info = json.loads(subprocess.check_output(DOCKER + ['inspect', CONTAINER], text=True))[0]
    if (info['Name'] != '/' + CONTAINER or not info['State']['Running']
            or not any(m.get('Name') == CONTAINER and m['Type'] == 'volume' for m in info['Mounts'])):
        sys.exit('Refusing an unexpected/stopped container or verification volume.')
    command = DOCKER + ['exec', '-i', CONTAINER, 'psql', '--host', '/var/run/postgresql',
                        '--port', '5432', '-U', 'postgres', '-d', 'postgres', '-XAtq', '-v', 'ON_ERROR_STOP=1']

    def sql(statement):
        result = subprocess.run(command, input=statement, text=True, capture_output=True)
        if result.returncode:
            sys.exit('Local bills SQL failed (transaction rolled back):\n' + result.stderr)
        return result.stdout.strip()

    if sql("select to_regclass('public.playthroughs') is not null;") != 't':
        sys.exit('Local application schema is missing. Starting Docker installs infrastructure only; do not reset/reconstruct hosted migrations.')
    signatures = ','.join("'public." + f + "'" for f in FUNCTIONS)
    triggers = ','.join("'" + name + "'" for name in TRIGGERS)
    status = json.loads(sql(f"""select json_build_object(
      'marker',exists(select 1 from information_schema.columns where table_schema='public'
        and table_name='playthroughs' and column_name='expenses_initialized_at'),
      'functions',(select count(*) from unnest(array[{signatures}]) f where to_regprocedure(f) is not null),
      'triggers',(select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid
        where c.relnamespace='public'::regnamespace and not t.tgisinternal and t.tgname in ({triggers})),
      'definitions',(select count(*) from public.persona_expenses),
      'occurrences',(select count(*) from public.playthrough_expenses));"""))
    if status['marker'] and status['functions'] == len(FUNCTIONS) and status['triggers'] == len(TRIGGERS):
        print('READY: local bills schema, protected operations and financial snapshot are installed.')
        return
    print(f"NOT READY: marker={status['marker']}, bill functions={status['functions']}/{len(FUNCTIONS)}, "
          f"triggers={status['triggers']}/{len(TRIGGERS)}, definitions={status['definitions']}, occurrences={status['occurrences']}")
    if args.check:
        sys.exit(1)
    if status['marker'] or status['functions'] or status['triggers']:
        sys.exit('Partial bills installation detected; inspect it instead of resetting or reapplying blindly.')
    archive = None
    if status['definitions'] or status['occurrences']:
        if not args.archive_employment_fixture:
            sys.exit('Existing expense definitions block the approved empty-table migration. No data changed. '
                     'Inspect them; --archive-employment-fixture is only for the known synthetic Local rent fixture.')
        records = json.loads(sql("""select coalesce(json_agg(json_build_object('expense',to_jsonb(e),
          'persona_name',p.name,'persona_description',p.description)),'[]'::json)
          from public.persona_expenses e join public.personas p on p.persona_id=e.persona_id;"""))
        if (status['occurrences'] != 0 or len(records) != 1 or status['definitions'] != 1
                or records[0]['persona_name'] != '[LOCAL TEST] Alex'
                or records[0]['persona_description'] != 'Synthetic local employment fixture.'
                or records[0]['expense']['name'] != 'Local rent'
                or records[0]['expense']['amount'] != 50
                or records[0]['expense']['first_due_day'] != 7
                or records[0]['expense']['repeat_interval_days'] is not None):
            sys.exit('Refusing to archive anything except the known unreferenced employment fixture; no data changed.')
        directory = Path(tempfile.gettempdir()) / 'team6310-phase2-verification'
        if directory.is_symlink() or (directory.exists() and directory.stat().st_uid != os.getuid()):
            sys.exit('Refusing an unsafe backup directory.')
        directory.mkdir(mode=0o700, parents=True, exist_ok=True)
        directory.chmod(0o700)
        backup = directory / ('bills-employment-expense-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ') + '.json')
        with backup.open('x') as output:
            os.chmod(backup, 0o600)
            json.dump(records, output, indent=2)
        archive = records[0]['expense']
        print(f'Backed up synthetic expense definition: {backup}')
    body = '\n'.join(migration_body((ROOT / 'supabase/migrations' / name).read_text()) for name in MIGRATIONS)
    # Locks keep old-run checks reliable, and recheck the archived row inside the
    # transaction so an intervening edit cannot be silently removed.
    remove = ''
    if archive:
        serialized = json.dumps(archive).replace("'", "''")
        remove = f"""DO $$ BEGIN
          IF (SELECT count(*) FROM public.persona_expenses)<>1 OR NOT EXISTS(
            SELECT 1 FROM public.persona_expenses e WHERE to_jsonb(e)='{serialized}'::jsonb)
          THEN RAISE EXCEPTION 'Fixture changed since backup; refusing removal'; END IF;
        END $$;
        DELETE FROM public.persona_expenses;
        """
    sql("BEGIN;\nLOCK TABLE public.playthroughs,public.player_responses,public.persona_expenses,public.playthrough_expenses IN ACCESS EXCLUSIVE MODE;\n"
        + "SELECT set_config('cac.local_bills_before',(" + SNAPSHOT + ")::text,true);\n"
        + remove + body + "\nDO $$ BEGIN IF current_setting('cac.local_bills_before')::jsonb IS DISTINCT FROM ("
        + SNAPSHOT + ") THEN RAISE EXCEPTION 'Existing gameplay changed; rolling back'; END IF; END $$;\n"
        + "NOTIFY pgrst,'reload schema';\nCOMMIT;")
    print('PASS: installed all three bills stages atomically; existing runs, responses and employment/scenario functions preserved.')
    print('Start a NEW playthrough to test bills. Existing runs are not initialized or migrated.')


if __name__ == '__main__':
    main()
