"""Trusted fixture teardown, never an application operation.

Only the fixed LOCAL verification container is addressed. IDs must form a new
fixture lineage rooted in the synthetic fixture marker. Never disable FK triggers;
existing references cause an atomic failure. Original trigger states are restored
inside the same locked transaction. No schema helper/backdoor is installed.
"""
import subprocess
import sys
import uuid

DB = ['docker', '--host', 'unix:///var/run/docker.sock', 'exec', '-i',
      'supabase_db_team6310-phase2-verification', 'psql', '-U', 'postgres', '-XAtq', '-v', 'ON_ERROR_STOP=1']


def cleanup(versions):
    ids = [str(uuid.UUID(v)) for v in versions]
    if not ids:
        return
    quoted = ','.join("'" + v + "'::uuid" for v in ids)
    statement = """BEGIN; SELECT pg_advisory_xact_lock(6310,1115);
DO $cleanup$
DECLARE versions uuid[]:=ARRAY[IDS]; root uuid:=versions[1]; t text; trigger_row record;
 saved jsonb:='[]'; item jsonb; reachable uuid[]; next_reachable uuid[];
 tables text[]:=ARRAY['public.content_versions','public.jobs','public.personas','public.scenarios','public.choices','public.persona_expenses','public.statistics','public.scenario_statistics','public.cac_support_effects','public.scenario_library_metadata','public.scenario_fact_copy','public.scenario_bill_links','public.scenario_edition_prices','cms_private.publications'];
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=root AND change_summary='Disposable publication fixture') THEN RAISE EXCEPTION 'Not a synthetic publication fixture root'; END IF;
 reachable:=ARRAY[root];
 LOOP
  SELECT coalesce(array_agg(DISTINCT id),'{}') INTO next_reachable FROM (SELECT unnest(reachable) id UNION SELECT version_id FROM cms_private.workspaces WHERE source_version=ANY(reachable) AND version_id=ANY(versions)) r;
  EXIT WHEN next_reachable @> reachable AND reachable @> next_reachable;
  reachable:=next_reachable;
 END LOOP;
 IF NOT reachable @> versions THEN RAISE EXCEPTION 'Refusing cleanup of IDs outside this synthetic fixture lineage'; END IF;
 -- Real application guards are deliberately tested before this owner-only teardown.
 -- Locks keep trigger changes invisible to concurrent writes; rollback restores all.
 FOREACH t IN ARRAY tables LOOP
  FOR trigger_row IN SELECT tgname,tgenabled FROM pg_trigger WHERE tgrelid=t::regclass AND NOT tgisinternal AND tgenabled<>'D' LOOP
   saved:=saved||jsonb_build_array(jsonb_build_object('table',t,'name',trigger_row.tgname,'mode',trigger_row.tgenabled));
   EXECUTE format('ALTER TABLE %s DISABLE TRIGGER %I',t::regclass,trigger_row.tgname);
  END LOOP;
 END LOOP;
 DELETE FROM public.playthroughs WHERE version_id=ANY(versions);
 DELETE FROM public.group_sessions WHERE version_id=ANY(versions);
 DELETE FROM cms_private.publication_permits WHERE version_id=ANY(versions);
 DELETE FROM cms_private.publications WHERE version_id=ANY(versions);
 FOREACH t IN ARRAY ARRAY['cms_private.choice_order','cms_private.receipts','cms_private.lineage','public.scenario_bill_links','public.scenario_fact_copy','public.scenario_library_metadata','public.scenario_statistics','public.cac_support_effects','public.choices','public.persona_expenses','public.scenarios','public.personas','public.jobs','public.statistics','public.scenario_edition_prices'] LOOP
  EXECUTE format('DELETE FROM %s WHERE version_id=ANY($1)',t::regclass) USING versions;
 END LOOP;
 DELETE FROM cms_private.workspaces WHERE version_id=ANY(versions);
 DELETE FROM public.content_versions WHERE version_id=ANY(versions);
 FOR item IN SELECT value FROM jsonb_array_elements(saved) LOOP
  EXECUTE format('ALTER TABLE %s ENABLE %s TRIGGER %I',(item->>'table')::regclass,
   CASE item->>'mode' WHEN 'R' THEN 'REPLICA' WHEN 'A' THEN 'ALWAYS' ELSE '' END,item->>'name');
 END LOOP;
END $cleanup$; COMMIT;""".replace('IDS', quoted)
    result = subprocess.run(DB, input=statement, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr)


if __name__ == '__main__':
    if len(sys.argv) < 3 or sys.argv[1] != 'cleanup':
        raise SystemExit('Expected cleanup followed by synthetic fixture lineage UUIDs')
    cleanup(sys.argv[2:])
