#!/usr/bin/env python3
"""Private, local-only account fixture for real browser verification; no migrations."""
import json
from pathlib import Path
import sys
import uuid
from test_staff_individual_local_api import Harness, sql


def load(path):
    path = Path(path)
    assert path.parent.name.startswith('team6310-stage3-api-') and path.name == 'browser-fixture.json'
    assert not path.is_symlink()
    return path, json.loads(path.read_text())


def main():
    action = sys.argv[1]
    if action == 'create':
        h = Harness()
        before, schema = h.fingerprints(), h.schema()
        existing = json.loads(sql('SELECT coalesce(json_agg(id),\'[]\') FROM auth.users;'))
        email, password = f'stage4-{uuid.uuid4()}@example.invalid', str(uuid.uuid4()) + 'aA!'
        session = h.request('/auth/v1/signup', {'email': email, 'password': password})
        actor = {**session, 'id': session['user']['id']}
        h.authorize(actor)
        path = h.folder / 'browser-fixture.json'
        path.write_text(json.dumps({'email': email, 'password': password, 'actor': actor,
                                    'anonymous': None, 'existing': existing, 'before': before,
                                    'schema': schema, 'folder': str(h.folder)}))
        path.chmod(0o600)
        print(path)
    elif action == 'anonymous':
        path, fixture = load(sys.argv[2])
        session = json.load(sys.stdin)
        actor = {**session, 'id': session['user']['id']}
        assert str(uuid.UUID(actor['id'])) == actor['id']
        assert actor['user']['is_anonymous'] and actor['id'] not in fixture['existing']
        assert actor['id'] != fixture['actor']['id']
        fixture['anonymous'] = actor
        path.write_text(json.dumps(fixture));path.chmod(0o600)
    elif action == 'inspect':
        _, fixture = load(sys.argv[2])
        counts = json.loads(sql("SELECT json_build_object('users',count(*),'anonymous',count(*) FILTER(WHERE is_anonymous),'groups',(SELECT count(*) FROM public.group_sessions),'members',(SELECT count(*) FROM public.group_participants)) FROM auth.users;"))
        print(json.dumps(counts))
    elif action == 'cleanup':
        path, fixture = load(sys.argv[2])
        h = Harness()
        h.folder = Path(fixture['folder'])
        h.before, h.schema_before = fixture['before'], fixture['schema']
        h.actors = {'staff': fixture['actor']}
        if fixture['anonymous']:
            h.actors['anonymous'] = fixture['anonymous']
        h.cleanup()
        result = {'staff_uuid': fixture['actor']['id'],
                  'anonymous_uuid': fixture['anonymous']['id'] if fixture['anonymous'] else None,
                  'cleanup_and_preservation': 'passed'}
        (h.folder / 'browser-cleanup.json').write_text(json.dumps(result, indent=2))
        path.unlink()  # Remove the private credentials and session tokens.
        print('Browser fixture credentials removed; original records/schema preserved.')
    else:
        raise SystemExit('Unknown fixture action')


if __name__ == '__main__':
    main()
