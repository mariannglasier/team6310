#!/usr/bin/env python3
"""Real concurrent sessions against the fixed LOCAL CMS verification database only.
Uses an existing local CMS workspace. Updates one scenario with its existing values.
Creates/removes only two explicitly tracked non-CMS edition-number test records.
"""
import json
import subprocess
import time
import uuid

DB = ['docker', '--host', 'unix:///var/run/docker.sock', 'exec', '-i',
      'supabase_db_team6310-phase2-verification', 'psql', '-U', 'postgres', '-XAtq', '-v', 'ON_ERROR_STOP=1']

def sql(query):
    r = subprocess.run(DB, input=query, text=True, capture_output=True)
    if r.returncode:
        raise RuntimeError(r.stderr)
    return r.stdout.strip()

def simultaneous(first, second):
    a = subprocess.Popen(DB, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    a.stdin.write(first); a.stdin.close()
    time.sleep(.15)
    b = subprocess.run(DB, input=second, text=True, capture_output=True)
    a.wait(timeout=20)
    return a.returncode, a.stderr.read(), b

actor = sql('SELECT user_id FROM public.cac_staff WHERE active LIMIT 1')
row = json.loads(sql("SELECT row_to_json(x) FROM (SELECT w.version_id,w.revision,s.scenario_id,s.title,s.description,s.category_id,s.persona_intent FROM cms_private.workspaces w JOIN public.scenarios s USING(version_id) WHERE s.category_id IS NOT NULL ORDER BY w.updated_at DESC LIMIT 1) x"))
assert str(uuid.UUID(actor)) == actor

def literal(value):
    return 'NULL' if value is None else "'" + str(value).replace("'", "''") + "'"

claims = "SELECT set_config('request.jwt.claim.sub',%s,true); SELECT set_config('request.jwt.claim.role','authenticated',true); SET LOCAL ROLE authenticated;" % literal(actor)
def save():
    values = [row['version_id'], row['revision'], str(uuid.uuid4()), row['scenario_id'], row['title'], row['description'], row['category_id'], row['persona_intent']]
    return 'SELECT public.cms_save_scenario(' + ','.join(literal(v) for v in values) + ');'
a, err, b = simultaneous('BEGIN;'+claims+save()+'SELECT pg_sleep(1); COMMIT;', 'BEGIN;'+claims+save()+'COMMIT;')
assert a == 0, err
assert b.returncode != 0 and 'Draft changed' in b.stderr, b.stderr
print('Concurrent scenario saves: first committed; overlapping stale save rejected.')
ids = [str(uuid.uuid4()), str(uuid.uuid4())]
try:
    def insert(i):
        return "INSERT INTO public.content_versions(version_id,version_number,status) VALUES('%s',1,'draft');" % ids[i]
    a, err, b = simultaneous('BEGIN;'+insert(0)+'SELECT pg_sleep(1); COMMIT;', 'BEGIN;'+insert(1)+'COMMIT;')
    assert a == 0, err
    assert b.returncode == 0, b.stderr
    assert sql("SELECT count(DISTINCT version_number) FROM public.content_versions WHERE version_id IN ('%s','%s')" % tuple(ids)) == '2'
    print('Concurrent edition allocation: distinct numbers assigned to competing writers.')
finally:
    sql("DELETE FROM public.content_versions WHERE NOT cms_managed AND version_id IN ('%s','%s')" % tuple(ids))
