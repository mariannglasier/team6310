#!/usr/bin/env python3
"""Generate local compatibility DDL from catalog evidence; NEVER a migration."""
import csv
import hashlib
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/local/database-schema.csv'
OUTPUT = Path('/tmp/team6310-phase2-verification/application-schema.sql')

def ident(value):
    return '"' + value.replace('"', '""') + '"'

def qualified(value):
    return '.'.join(map(ident, value.split('.')))

def fields(text):
    return dict(re.findall(r'(?:^|; )(\w+)=([^;]*)(?=; |$)', text))

def generate():
    rows = list(csv.DictReader(SOURCE.open()))
    tables = {r['object_name']: fields(r['definition']) for r in rows if r['section']=='02_TABLES' and r['object_name'].startswith('public.')}
    assert len(tables)==15 and all(v['kind']=='r' for v in tables.values())
    out = ['-- LOCAL ONLY: reconstructed structure, not historical DDL.', '-- Source SHA256: '+hashlib.sha256(SOURCE.read_bytes()).hexdigest(), 'begin;', 'set local search_path=public,pg_catalog;']
    columns = {}
    for r in rows:
        if r['section']=='03_COLUMNS' and r['object_name'].rsplit('.',1)[0] in tables:
            table,column=r['object_name'].rsplit('.',1);f=fields(r['definition'])
            assert not f['identity'], 'Identity reconstruction not implemented'
            sql=ident(column)+' '+f['type']
            if f['generated']:
                assert f['generated']=='s'
                sql+=' generated always as ('+f['default']+') stored'
            elif f['default']!='<none>': sql+=' default '+f['default']
            if f['nullable']=='false':sql+=' not null'
            columns.setdefault(table,[]).append((int(f['position']),sql))
    for table,meta in tables.items():
        out.append('create table '+qualified(table)+' (\n'+',\n'.join(c for _,c in sorted(columns[table]))+'\n);')
        out.append('alter table '+qualified(table)+' owner to '+ident(meta['owner'])+';')
        out.append('alter table '+qualified(table)+(' enable' if meta['rls']=='true' else ' disable')+' row level security;')
        if meta['force_rls']=='true':out.append('alter table '+qualified(table)+' force row level security;')
        out.append('revoke all on '+qualified(table)+' from public,anon,authenticated,service_role;')
    constraints=[r for r in rows if r['section']=='04_CONSTRAINTS' and r['object_name'].rsplit('.',1)[0] in tables]
    for r in sorted(constraints,key=lambda r:fields(r['definition'])['type']=='f'):
        table,name=r['object_name'].rsplit('.',1);f=fields(r['definition']);definition=r['definition'].split('; definition=',1)[1]
        out.append('alter table '+qualified(table)+' add constraint '+ident(name)+' '+definition+(' not valid' if f['validated']=='false' else '')+';')
    names={r['object_name'] for r in constraints if fields(r['definition'])['type'] in ('p','u','x')}
    for r in rows:
        if r['section']=='05_INDEXES' and r['object_name'].rsplit('.',1)[0] in tables and r['object_name'] not in names:out.append(r['definition']+';')
    for r in rows:
        if r['section']=='09_ROUTINES' and r['object_name'].startswith('public.'):
            meta,ddl=r['definition'].split('\n',1);f=fields(meta)
            out.append(ddl.rstrip().rstrip(';')+';')
            sig=r['object_name']
            # Argument names in catalog signature are valid in ALTER FUNCTION.
            out.append('alter function '+sig+' owner to '+ident(f['owner'])+';')
            out.append('revoke all on function '+sig+' from public,anon,authenticated,service_role;')
            for role,priv in re.findall(r'(\w*)=([X*]+)/',f['acl']):
                out.append('grant execute on function '+sig+' to '+(ident(role) if role else 'public')+(' with grant option' if '*' in priv else '')+';')
    for r in rows:
        if r['section']=='06_TRIGGERS' and r['object_name'].rsplit('.',1)[0] in tables:out.append(r['definition']+';')
        if r['section']=='07_RLS_POLICIES' and r['object_name'].rsplit('.',1)[0] in tables:
            table,name=r['object_name'].rsplit('.',1)
            # USING/CHECK contain arbitrary SQL and can contain semicolons/newlines.
            m=re.fullmatch(r'permissive=(.*?); roles=\{(.*?)\}; command=(.*?); using=(.*); check=(.*)',r['definition'],re.S);assert m
            mode,roles,command,using,check=m.groups()
            sql='create policy '+ident(name)+' on '+qualified(table)+' as '+mode+' for '+command+' to '+','.join(ident(x) if x!='public' else x for x in roles.split(','))
            if using!='<none>':sql+=' using ('+using+')'
            if check!='<none>':sql+=' with check ('+check+')'
            out.append(sql+';')
        if r['section'] in ('08_TABLE_PRIVILEGES','08_COLUMN_PRIVILEGES'):
            parts=r['object_name'].split('.');table='.'.join(parts[:2])
            if table not in tables:continue
            f=fields(r['definition']);role=parts[-1]
            if role=='authenticate':
                assert r['object_name']=='public.playthrough_expenses.playthrough_expense_id.authenticate' and f['privilege']=='SELECT'
                assert any(x['section']=='08_TABLE_PRIVILEGES' and x['object_name']=='public.playthrough_expenses.authenticated' and fields(x['definition'])['privilege']=='SELECT' for x in rows)
                print('NOTE: omitted truncated column-grantee identifier; exported table-level authenticated SELECT already covers this column.')
                continue
            column=' ('+ident(parts[2])+')' if len(parts)==4 else ''
            out.append('grant '+f['privilege']+column+' on '+qualified(table)+' to '+ident(role)+(' with grant option' if f['grantable']=='YES' else '')+';')
    # Reproduce exported PUBLIC/postgres creation defaults, including function grants
    # that the actual Phase 2 migration must normalize.
    codes={'r':'SELECT','a':'INSERT','w':'UPDATE','d':'DELETE','D':'TRUNCATE','x':'REFERENCES','t':'TRIGGER','X':'EXECUTE','U':'USAGE','m':'MAINTAIN'}
    for r in rows:
        if r['section']=='16_DEFAULT_PRIVILEGES' and r['object_name']=='public.postgres':
            f=fields(r['definition']);kind={'f':'functions','r':'tables','S':'sequences'}[f['object_type']]
            for role,priv in re.findall(r'(\w*)=([A-Za-z*]+)/',f['privileges']):
                assert '*' not in priv
                out.append('alter default privileges for role postgres in schema public grant '+','.join(codes[x] for x in priv)+' on '+kind+' to '+(ident(role) if role else 'public')+';')
    out+=['commit;']
    OUTPUT.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
    OUTPUT.write_text('\n'.join(out)+'\n')
    print(f'Generated {OUTPUT}: {len(tables)} public tables; no data, roles, Auth objects or historical migrations reconstructed.')

if __name__=='__main__':generate()
