#!/usr/bin/env python3
"""Run rollback-only CMS SQL suites against the fixed isolated local container."""
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
DB = ['docker', '--host', 'unix:///var/run/docker.sock', 'exec', '-i',
      'supabase_db_team6310-phase2-verification', 'psql', '-U', 'postgres', '-X', '-v', 'ON_ERROR_STOP=1']


def expand(path):
    return re.sub(r'^\\ir (.+)$', lambda match: expand(path.parent / match[1]), path.read_text(), flags=re.M)


def main():
    for path in sorted((ROOT / 'supabase/tests').glob('cms-*.sql')):
        result = subprocess.run(DB, input=expand(path), text=True, capture_output=True)
        print(path.name, 'PASS' if result.returncode == 0 else 'FAIL', flush=True)
        if result.returncode:
            print(result.stdout[-1500:], result.stderr[-3500:])
            raise SystemExit(result.returncode)


if __name__ == '__main__':
    main()
