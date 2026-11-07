"""Compare reconstructed application catalogs to the supplied export (local only)."""
import csv
import json
import re
from verify_employment_local import ROOT, sql

rows=list(csv.DictReader((ROOT/'docs/local/database-schema.csv').open()))
norm=lambda s: re.sub(r'\s+',' ',s).strip()
expected={r['object_name']:norm(r['definition'].split('; definition=',1)[1]) for r in rows if r['section']=='04_CONSTRAINTS' and r['object_name'].startswith('public.')}
actual=json.loads(sql("select json_object_agg('public.'||c.relname||'.'||n.conname,pg_get_constraintdef(n.oid,true)) from pg_constraint n join pg_class c on c.oid=n.conrelid where c.relnamespace='public'::regnamespace;"))

for k in set(expected)|set(actual):
 if expected.get(k)!=norm(actual.get(k,'')):print(k,'EXPORT:',expected.get(k),'LOCAL:',actual.get(k))
assert expected=={k:norm(v) for k,v in actual.items()}, 'Constraint drift'
expected_tables={r['object_name']:r['definition'] for r in rows if r['section']=='02_TABLES' and r['object_name'].startswith('public.')}
actual_tables=json.loads(sql("select json_object_agg('public.'||relname,'kind='||relkind::text||'; owner='||pg_get_userbyid(relowner)||'; rls='||relrowsecurity||'; force_rls='||relforcerowsecurity) from pg_class where relnamespace='public'::regnamespace and relkind='r';"))
assert expected_tables==actual_tables,'Table ownership/RLS drift'
expected_indexes={r['object_name']:norm(r['definition']) for r in rows if r['section']=='05_INDEXES' and r['object_name'].startswith('public.')}
actual_indexes=json.loads(sql("select json_object_agg('public.'||tablename||'.'||indexname,indexdef) from pg_indexes where schemaname='public';"))
assert expected_indexes=={k:norm(v) for k,v in actual_indexes.items()},'Index drift'
expected_policies={r['object_name'] for r in rows if r['section']=='07_RLS_POLICIES' and r['object_name'].startswith('public.')}
actual_policies=json.loads(sql("select json_agg('public.'||tablename||'.'||policyname) from pg_policies where schemaname='public';"))
assert expected_policies==set(actual_policies),'Policy inventory drift'
print(f'PASS: {len(expected_tables)} public table owners/RLS settings, {len(expected)} constraints, {len(expected_indexes)} indexes, {len(expected_policies)} policy names match export; new Phase 2 objects are tested separately.')
# Compare types/nullability/default expressions, excluding historical attnum gaps.
expected_columns={r['object_name']:r['definition'] for r in rows if r['section']=='03_COLUMNS' and r['object_name'].startswith('public.')}
actual_columns=json.loads(sql("""select json_object_agg('public.'||c.relname||'.'||a.attname,json_build_object('type',format_type(a.atttypid,a.atttypmod),'nullable',not a.attnotnull,'default',coalesce(pg_get_expr(d.adbin,d.adrelid),'<none>'),'generated',a.attgenerated::text,'identity',a.attidentity::text)) from pg_attribute a join pg_class c on c.oid=a.attrelid left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where c.relnamespace='public'::regnamespace and c.relkind='r' and a.attnum>0 and not a.attisdropped;"""))
from reconstruct_local_schema import fields
assert set(expected_columns)==set(actual_columns)
for name,definition in expected_columns.items():
    e=fields(definition);a=actual_columns[name]
    assert e['type']==a['type'] and e['nullable']==str(a['nullable']).lower() and e['generated']==a['generated'] and e['identity']==a['identity'],name
    assert norm(e['default'])==norm(a['default']),f'Default drift {name}: {e["default"]} != {a["default"]}'
# Compare expressions, not just policy inventory; names may be truncated in export.
actual_policy=json.loads(sql("""select json_object_agg('public.'||tablename||'.'||policyname,json_build_object('using',coalesce(qual,'<none>'),'check',coalesce(with_check,'<none>'),'command',cmd,'roles',roles::text,'permissive',permissive)) from pg_policies where schemaname='public';"""))
for r in rows:
    if r['section']!='07_RLS_POLICIES' or not r['object_name'].startswith('public.'):continue
    m=re.fullmatch(r'permissive=(.*?); roles=(.*?); command=(.*?); using=(.*); check=(.*)',r['definition'],re.S)
    a=actual_policy[r['object_name']]
    assert m.groups()[:3]==(a['permissive'],a['roles'],a['command'])
    assert norm(m[4])==norm(a['using']) and norm(m[5])==norm(a['check']),r['object_name']
print(f'PASS: all {len(expected_columns)} public column types/nullability/defaults/generated flags and all exported policy expressions match.')

# Effective privilege matrix for the public API roles, including column checks.
from collections import defaultdict
expected_grants=defaultdict(set)
expected_column=defaultdict(set)
for r in rows:
    if r['section']=='08_TABLE_PRIVILEGES' and r['object_name'].startswith('public.'):
        schema,table,role=r['object_name'].split('.')
        expected_grants[(table,role)].add(fields(r['definition'])['privilege'])
    if r['section']=='08_COLUMN_PRIVILEGES' and r['object_name'].startswith('public.'):
        schema,table,col,role=r['object_name'].split('.')
        if role=='authenticate':continue  # explicitly documented truncated export row
        expected_column[(table,col,role)].add(fields(r['definition'])['privilege'])
checks=[]
for table in [t.split('.')[1] for t in expected_tables]:
    for role in ['anon','authenticated','service_role']:
        for privilege in ['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']:
            checks.append((f"has_table_privilege('{role}','public.{table}','{privilege}')",privilege in expected_grants[(table,role)]))
for (table,col,role),privileges in expected_column.items():
    if role not in ['anon','authenticated','service_role']:continue
    for privilege in ['SELECT','INSERT','UPDATE','REFERENCES']:
        checks.append((f"has_column_privilege('{role}','public.{table}','{col}','{privilege}')",privilege in privileges))
values=json.loads(sql('select json_build_array('+','.join(q for q,_ in checks)+');')) if len(checks)<90 else None
# PostgreSQL has an argument limit; issue bounded batches.
for offset in range(0,len(checks),60):
    batch=checks[offset:offset+60]
    values=json.loads(sql('select json_build_array('+','.join(q for q,_ in batch)+');'))
    for (query,expected),value in zip(batch,values):assert expected==value,query
print(f'PASS: {len(checks)} effective table/column privilege checks against exported API-role grants.')
