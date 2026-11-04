#!/usr/bin/env python3
"""Disposable local stack ONLY. Never imports or applies repository migrations."""
import argparse
import base64
import secrets
import urllib.request
import urllib.error
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import tomllib
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
WORKDIR = Path(tempfile.gettempdir()) / 'team6310-phase2-verification'
PROJECT = 'team6310-phase2-verification'
SOCKET = 'unix:///var/run/docker.sock'
CONFIG = '''project_id = "team6310-phase2-verification"
[api]
enabled = true
port = 55321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
[db]
port = 55322
shadow_port = 55320
major_version = 17
[db.migrations]
enabled = false
schema_paths = []
[db.seed]
enabled = false
sql_paths = []
[studio]
enabled = false
[analytics]
enabled = false
[auth]
enabled = true
site_url = "http://127.0.0.1:5173"
additional_redirect_urls = ["http://127.0.0.1:5173"]
enable_signup = true
enable_anonymous_sign_ins = true
[auth.email]
enable_signup = true
enable_confirmations = false
'''
LEGACY_CONFIG = CONFIG
CONFIG = CONFIG.replace('[studio]\nenabled = false', '[studio]\nenabled = true\nport = 55323\napi_url = "http://127.0.0.1"')
NETWORK = PROJECT + '-loopback'
EXCLUDED = 'realtime,storage-api,imgproxy,mailpit,edge-runtime,logflare,vector,supavisor'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['start', 'status', 'stop', 'reset', 'frontend-env', 'smoke', 'studio'])
    args = parser.parse_args()
    # Nothing here reads frontend environment files, CLI profiles or hosted secrets.
    cli = ROOT / 'frontend/node_modules/.bin/supabase'
    if not cli.exists():
        sys.exit('Install repository frontend dependencies first; Supabase CLI is missing.')
    env = os.environ.copy()
    env['DOCKER_HOST'] = SOCKET
    env.pop('DOCKER_CONTEXT', None)
    # Do not inherit cloud credentials or a database connection from the shell.
    for key in list(env):
        if key.startswith('SUPABASE_') or key in ('DATABASE_URL', 'PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE', 'PGSERVICE', 'PGSERVICEFILE'):
            env.pop(key)
    subprocess.run(['docker', '--host', SOCKET, 'info', '--format', '{{.ServerVersion}}'], env=env, check=True)
    if WORKDIR.is_symlink():
        sys.exit('Refusing symlinked verification workdir.')
    WORKDIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    if WORKDIR.stat().st_uid != os.getuid():
        sys.exit('Verification workdir is owned by another user.')
    WORKDIR.chmod(0o700)
    directory = WORKDIR / 'supabase'
    if directory.is_symlink():
        sys.exit('Refusing symlinked config directory.')
    directory.mkdir(parents=True, exist_ok=True)
    config = directory / 'config.toml'
    if not config.exists():
        config.write_text(CONFIG)
    if not config.is_symlink() and args.action == 'studio' and config.read_text() == LEGACY_CONFIG:
        config.write_text(CONFIG)
    if config.is_symlink() or config.read_text() != CONFIG:
        sys.exit('Verification config differs from the reviewed isolated template. Refusing operation.')
    parsed = tomllib.loads(config.read_text())
    assert parsed['project_id'] == PROJECT and not parsed['db']['migrations']['enabled']
    if (directory / '.temp/project-ref').exists():
        sys.exit('Refusing a workdir linked to a hosted project.')
    if (directory / 'migrations').exists() or (directory / 'seed.sql').exists():
        sys.exit('This infrastructure-only harness refuses automatic application schema/seed files.')
    base = [str(cli), '--workdir', str(WORKDIR)]
    if args.action in ('status', 'frontend-env', 'smoke'):
        result = subprocess.run(base + ['status', '--output', 'json'], env=env, check=True, capture_output=True, text=True)
        data = json.loads(result.stdout)
        api = data.get('API_URL', '')
        url = urlsplit(api)
        if url.hostname not in ('127.0.0.1', 'localhost') or url.port != 55321 or url.scheme != 'http':
            sys.exit('Refusing nonlocal/unexpected API endpoint.')
        if args.action == 'status':
            installed = subprocess.run(['docker','--host',SOCKET,'exec',f'supabase_db_{PROJECT}','psql','--host','/var/run/postgresql','-U','postgres','-d','postgres','-Atqc',"select to_regclass('public.playthroughs') is not null"],env=env,check=True,capture_output=True,text=True).stdout.strip() == 't'
            print('Studio: http://127.0.0.1:55323')
            print(f'Project: {PROJECT}\nAPI: {api}\nDatabase: 127.0.0.1:55322\nApplication schema: {"installed (verify catalogs separately)" if installed else "NOT installed"}')
        elif args.action == 'frontend-env':
            key = data.get('PUBLISHABLE_KEY') or data.get('ANON_KEY')
            if not isinstance(key, str) or not key:
                sys.exit('CLI did not return a local frontend key.')
            output = ROOT / 'frontend/.env.verification.local'
            if output.is_symlink():
                sys.exit('Refusing symlinked frontend env file.')
            output.write_text(f'VITE_SUPABASE_URL={api}\nVITE_SUPABASE_PUBLISHABLE_KEY={key}\n')
            output.chmod(0o600)
            print('Wrote ignored frontend/.env.verification.local; hosted .env.local was not read or replaced.')
        else:
            public_key = data.get('PUBLISHABLE_KEY') or data.get('ANON_KEY')
            if not public_key:
                sys.exit('Local API key unavailable.')
            def request(path, body=None, token=None):
                headers = {'apikey': public_key, 'Content-Type': 'application/json'}
                if token:
                    headers['Authorization'] = f'Bearer {token}'
                req = urllib.request.Request(api + path, headers=headers,
                    data=None if body is None else json.dumps(body).encode())
                try:
                    with urllib.request.urlopen(req, timeout=30) as response:
                        return response.status, json.load(response)
                except urllib.error.HTTPError as error:
                    return error.code, json.loads(error.read())
            for label, body, expected in [
                ('anonymous', {}, True),
                ('registered', {'email': f'local-{secrets.token_hex(8)}@example.invalid', 'password': secrets.token_urlsafe(24)}, False),
            ]:
                status, result = request('/auth/v1/signup', body)
                if status != 200 or result.get('user', {}).get('is_anonymous') is not expected or not result.get('access_token'):
                    sys.exit(f'{label} local Auth smoke failed (HTTP {status}); no response/token logged.')
                encoded = result['access_token'].split('.')[1]
                claims = json.loads(base64.urlsafe_b64decode(encoded + '=' * (-len(encoded) % 4)))
                assert claims.get('is_anonymous') is expected
                status, _ = request('/auth/v1/user', token=result['access_token'])
                assert status == 200
                print(f'PASS: local {label} Auth signup, JWT anonymous claim and authenticated user endpoint')
            status, _ = request('/rest/v1/playthroughs?select=playthrough_id')
            assert status in (401,403,404), 'Unauthenticated application access must not succeed'
            print(f'PASS: REST API reachable; unauthenticated playthrough access denied (HTTP {status}).')
            command = ['docker', '--host', SOCKET, 'exec', f'supabase_db_{PROJECT}',
                       'psql', '-U', 'postgres', '-d', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1', '-c',
                       "select pg_backend_pid(),to_regclass('auth.users') is not null,to_regclass('public.playthroughs') is not null,to_regclass('public.personas') is not null,to_regclass('public.content_versions') is not null"]
            first = subprocess.Popen(command, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            second = subprocess.Popen(command, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            results = [first.communicate(), second.communicate()]
            assert first.returncode == 0 and second.returncode == 0
            rows = [r[0].strip().split('|') for r in results]
            assert rows[0][0] != rows[1][0] and all(r[1]=='t' for r in rows) and rows[0][2:]==rows[1][2:]
            print('PASS: independent local PostgreSQL connections and consistent schema visibility. No gameplay locking claim.')
    else:
        def private_log(name, result):
            log = WORKDIR / f'{name}.log'
            log.write_text(result.stdout + result.stderr)
            log.chmod(0o600)
            if result.returncode:
                sys.exit(f'{name} failed; inspect private log {log}')

        snapshot_command = ['docker','--host',SOCKET,'exec',f'supabase_db_{PROJECT}',
            'psql','--host','/var/run/postgresql','--port','5432','-U','postgres','-d','postgres','-Atqc',
            "select count(*),md5(coalesce(jsonb_agg(to_jsonb(p) order by playthrough_id)::text,'')) from public.playthroughs p"]
        before = None
        if args.action == 'studio':
            before = subprocess.run(snapshot_command,env=env,check=True,capture_output=True,text=True).stdout
            stopped = subprocess.run(base + ['stop'],env=env,capture_output=True,text=True)
            private_log('studio-stop', stopped)
        if args.action in ('studio','start'):
            network = subprocess.run(['docker','--host',SOCKET,'network','inspect',NETWORK],env=env,capture_output=True,text=True)
            if network.returncode:
                subprocess.run(['docker','--host',SOCKET,'network','create','--driver','bridge','--opt','com.docker.network.bridge.host_binding_ipv4=127.0.0.1',NETWORK],env=env,check=True,capture_output=True,text=True)
            else:
                if json.loads(network.stdout)[0].get('Options',{}).get('com.docker.network.bridge.host_binding_ipv4') != '127.0.0.1':
                    sys.exit('Refusing a network without loopback-only port binding.')
        commands = {'start': ['start', '--exclude', EXCLUDED, '--network-id', NETWORK], 'studio': ['start','--exclude',EXCLUDED,'--network-id',NETWORK], 'stop': ['stop'], 'reset': ['db', 'reset', '--local', '--no-seed']}
        # Start can print disposable local keys; capture logs in the isolated dir.
        result = subprocess.run(base + commands[args.action], env=env, capture_output=True, text=True)
        log = WORKDIR / f'{args.action}.log'
        log.write_text(result.stdout + result.stderr)
        log.chmod(0o600)
        print(f'{args.action}: exit {result.returncode}; private local log: {log}')
        if not result.returncode and before is not None:
            after = subprocess.run(snapshot_command,env=env,check=True,capture_output=True,text=True).stdout
            if after != before:
                sys.exit('Playthrough snapshot changed; inspect local data before continuing.')
            print('Verified: playthrough count and full-row checksum unchanged. Studio: http://127.0.0.1:55323')
        if result.returncode:
            print('Failed; inspect the private log. No hosted command was issued.')
        elif args.action == 'reset':
            (WORKDIR / 'fixture.json').unlink(missing_ok=True)
        sys.exit(result.returncode)


if __name__ == '__main__':
    main()
