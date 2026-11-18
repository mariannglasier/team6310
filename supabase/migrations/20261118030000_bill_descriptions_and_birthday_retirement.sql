BEGIN;
-- Expose only an owned run's edition-pinned bill description; no private link table grants.
CREATE FUNCTION public.bill_description(p_occurrence uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT s.description FROM public.playthrough_expenses e
 JOIN public.playthroughs p USING(playthrough_id,version_id)
 JOIN public.scenario_bill_links l USING(expense_id,version_id)
 JOIN public.scenarios s ON s.scenario_id=l.scenario_id AND s.version_id=l.version_id
 WHERE e.playthrough_expense_id=p_occurrence AND p.owner_user_id=auth.uid()
 AND p.session_id IS NULL AND public.is_individual_player();
$$;
REVOKE ALL ON FUNCTION public.bill_description(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bill_description(uuid) TO authenticated,service_role;
DO $migration$
DECLARE definition text;
BEGIN
 definition:=pg_get_functiondef('public.get_bill_snapshot(uuid)'::regprocedure);
 IF position('jsonb_agg(to_jsonb(e) ORDER BY' IN definition)=0 THEN RAISE EXCEPTION 'Review changed bill snapshot before adding descriptions'; END IF;
 EXECUTE replace(definition,'jsonb_agg(to_jsonb(e) ORDER BY','jsonb_agg(to_jsonb(e)||jsonb_build_object(''description'',public.bill_description(e.playthrough_expense_id)) ORDER BY');
 definition:=pg_get_functiondef('public.publish_scenario_source_edition(jsonb)'::regprocedure);
 IF position('jsonb_array_length(payload)<>51' IN definition)=0 THEN RAISE EXCEPTION 'Review changed library publisher before retiring birthday'; END IF;
 definition:=replace(definition,'jsonb_array_length(payload)<>51','jsonb_array_length(payload)<>50');
 definition:=replace(definition,'AS item(value))<>51','AS item(value))<>50');
 definition:=replace(definition,'''D041'',''D057''','''D041'',''D052'',''D057''');
 definition:=replace(definition,'D041/D057/D060 retired','D041/D052/D057/D060 retired');
 EXECUTE definition;
END $migration$;
COMMIT;
