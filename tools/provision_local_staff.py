#!/usr/bin/env python3
"""Provision/reuse the dedicated LOCAL manual-testing staff account.

Fixed Docker socket, container, API and email; no hosted URL or secrets accepted.
Uses supported email/password Auth signup (local email autoconfirm required), then
trusted SQL authorization through existing cac_staff. No service-role key needed.
Passwords live only in a mode-0600 file outside the repository, never stdout.
"""
import json
import os
from pathlib import Path
import secrets
import subprocess
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
EMAIL = 'cac-admin@local.test'
API = 'http://127.0.0.1:55321'
PROJECT = 'team6310-phase2-verification'
DOCKER = ['docker', '--host', 'unix:///var/run/docker.sock']
DIRECTORY = Path('/tmp/team6310-local-manual-staff')
CREDENTIALS = DIRECTORY / 'credentials.json'


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise RuntimeError('Refusing redirected local request')


def sql(query):
    result = subprocess.run(DOCKER + ['exec', '-i', 'supabase_db_' + PROJECT,
                            'psql', '-U', 'postgres', '-d', 'postgres', '-XAtq',
                            '-v', 'ON_ERROR_STOP=1'], input=query, text=True,
                            capture_output=True)
    if result.returncode:
        raise RuntimeError('Local SQL operation failed; inspect the local schema without changing migrations.')
    return result.stdout.strip()


def main():
    if DIRECTORY.is_symlink() or CREDENTIALS.is_symlink():
        raise RuntimeError('Refusing symlinked credential storage')
    DIRECTORY.mkdir(mode=0o700, exist_ok=True)
    if DIRECTORY.stat().st_uid != os.getuid():
        raise RuntimeError('Credential directory belongs to another user')
    DIRECTORY.chmod(0o700)
    inspected = json.loads(subprocess.check_output(DOCKER + ['inspect', 'supabase_auth_' + PROJECT], text=True))[0]
    if not inspected['State']['Running'] or inspected['Name'] != '/supabase_auth_' + PROJECT:
        raise RuntimeError('Expected local Auth container is unavailable')
    env = dict(item.split('=', 1) for item in inspected['Config']['Env'] if '=' in item)
    if env.get('GOTRUE_EXTERNAL_EMAIL_ENABLED') != 'true' or env.get('GOTRUE_DISABLE_SIGNUP') != 'false' or env.get('GOTRUE_MAILER_AUTOCONFIRM') != 'true':
        raise RuntimeError('Local email signup/autoconfirm prerequisites differ; no Auth settings changed')
    values = dict(line.split('=', 1) for line in (ROOT / 'frontend/.env.verification.local').read_text().splitlines() if '=' in line)
    if values.get('VITE_SUPABASE_URL') != API:
        raise RuntimeError('Verification environment is not the fixed local API')
    key = values['VITE_SUPABASE_PUBLISHABLE_KEY']
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())

    def request(path, body, token=None):
        headers = {'apikey': key, 'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = 'Bearer ' + token
        req = urllib.request.Request(API + path, headers=headers, data=json.dumps(body).encode())
        try:
            with opener.open(req, timeout=20) as response:
                text = response.read()
                return json.loads(text) if text else None
        except urllib.error.HTTPError as error:
            # Never echo Auth response bodies or credential-bearing requests.
            raise RuntimeError(f'Local Auth/API request failed: HTTP {error.code} at {path.split("?")[0]}') from None

    preservation_query = """SELECT jsonb_build_object(
      'other_auth', (SELECT md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY u.id)::text,''))
        FROM auth.users u WHERE lower(email) IS DISTINCT FROM 'cac-admin@local.test'),
      'other_staff', (SELECT md5(coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.user_id)::text,''))
        FROM public.cac_staff s WHERE NOT EXISTS(SELECT 1 FROM auth.users u
          WHERE u.id=s.user_id AND lower(u.email)='cac-admin@local.test')));"""
    original_records = sql(preservation_query)
    existing = json.loads(sql("SELECT coalesce(json_agg(json_build_object('id',id,'anonymous',is_anonymous)),'[]') FROM auth.users WHERE lower(email)='cac-admin@local.test';"))
    if CREDENTIALS.exists():
        CREDENTIALS.chmod(0o600)
        account = json.loads(CREDENTIALS.read_text())
        if account.get('api') != API or account.get('email') != EMAIL or account.get('purpose') != 'dedicated-local-manual-staff':
            raise RuntimeError('Credential file does not identify this dedicated local account')
        uid = str(uuid.UUID(account['user_id']))
        if existing != [{'id': uid, 'anonymous': False}]:
            raise RuntimeError('Saved local identity no longer matches Auth; no account overwritten')
        created = False
    else:
        if existing:
            raise RuntimeError('Email already exists without this tool\'s credential record; refusing to change it')
        account = {'purpose': 'dedicated-local-manual-staff', 'api': API,
                   'email': EMAIL, 'password': secrets.token_urlsafe(24) + 'aA1!'}
        # Reserve private storage BEFORE creating Auth; a failure leaves the local
        # credential material available for operator recovery, never an overwrite.
        fd = os.open(CREDENTIALS, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'w') as handle:
            json.dump(account, handle, indent=2)
        session = request('/auth/v1/signup', {'email': EMAIL, 'password': account['password']})
        user = session['user']
        uid = str(uuid.UUID(user['id']))
        if user.get('is_anonymous') is not False or not user.get('email_confirmed_at'):
            raise RuntimeError('Expected confirmed non-anonymous local Auth account')
        account['user_id'] = uid
        CREDENTIALS.write_text(json.dumps(account, indent=2)); CREDENTIALS.chmod(0o600)
        # Release only the provisioning session, never the user's other sessions.
        request('/auth/v1/logout?scope=local', {}, session['access_token'])
        created = True
    session = request('/auth/v1/token?grant_type=password', {'email': EMAIL, 'password': account['password']})
    if session['user']['id'] != uid or session['user'].get('is_anonymous') is not False:
        raise RuntimeError('Password authentication returned an unexpected identity')
    # Only this authenticated dedicated account is provisioned; all other users
    # (including placeholder accounts) remain unchanged.
    sql(f"INSERT INTO public.cac_staff(user_id,active) VALUES('{uid}',true) ON CONFLICT(user_id) DO UPDATE SET active=true;")
    if request('/rest/v1/rpc/is_cac_staff', {}, session['access_token']) is not True:
        raise RuntimeError('Database did not authorize the dedicated staff account')
    request('/auth/v1/logout?scope=local', {}, session['access_token'])
    if sql(preservation_query) != original_records:
        raise RuntimeError('Unrelated local Auth/staff records changed during provisioning; investigate')
    print(json.dumps({'created': created, 'email': EMAIL, 'user_id': uid,
                      'cac_staff_active': True, 'password_authentication': 'passed',
                      'is_cac_staff': True, 'unrelated_auth_and_staff_preserved': True, 'credentials_file': str(CREDENTIALS)}))


if __name__ == '__main__':
    main()
