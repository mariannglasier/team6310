#!/usr/bin/env python3
"""Install local scenario functions only; no linked project or resets."""
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
DOCKER = ['docker', '--host', 'unix:///var/run/docker.sock']
CONTAINER = 'supabase_db_team6310-phase2-verification'

def main():
    info = json.loads(subprocess.check_output(DOCKER + ['inspect', CONTAINER], text=True))[0]
    assert info['Name'] == '/' + CONTAINER and info['State']['Running']
    assert any(m.get('Name') == CONTAINER and m['Type'] == 'volume' for m in info['Mounts'])
    print('Verified fixed local Docker socket, running container and verification volume.')
    command = DOCKER + ['exec', '-i', CONTAINER, 'psql', '--host', '/var/run/postgresql',
                        '-U', 'postgres', '-d', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1']
    def sql(statement):
        return subprocess.run(command, input=statement, text=True, capture_output=True, check=True).stdout
    snapshot = """select count(*),md5(coalesce(jsonb_agg(to_jsonb(p) order by playthrough_id)::text,'')) from public.playthroughs p;
select count(*),md5(coalesce(jsonb_agg(to_jsonb(r) order by response_id)::text,'')) from public.player_responses r;
select md5(string_agg(pg_get_functiondef(oid),'' order by proname)) from pg_proc where pronamespace='public'::regnamespace and proname in ('submit_employment_action','mark_fresh_employment_run','valid_employment_document');"""
    before = sql(snapshot)
    print(sql((ROOT / 'tools/local_sql/scenario_submission.sql').read_text()).strip())
    assert before == sql(snapshot), 'Saved gameplay changed: investigate'
    print('PASS: saved playthroughs, responses and employment functions unchanged.')

if __name__ == '__main__':
    main()
