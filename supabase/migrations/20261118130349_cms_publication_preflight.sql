-- Stage 2: staff-only, read-only whole-edition preflight. No lifecycle changes.
BEGIN;
CREATE TABLE IF NOT EXISTS cms_private.publication_runtime_contract (
 signature text PRIMARY KEY, definition_hash text NOT NULL
);
ALTER TABLE cms_private.publication_runtime_contract ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON cms_private.publication_runtime_contract FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO cms_private.publication_runtime_contract
SELECT signature,md5(pg_get_functiondef(signature::regprocedure)) FROM unnest(ARRAY[
 'public.manage_scheduled_scenario_progression()', 'public.submit_scenario_decision(uuid,uuid,uuid)',
 'public.submit_employment_action(uuid,uuid,integer,jsonb)', 'public.get_event_recap_facts(uuid,text)',
 'group_private.configure_host_session(boolean,integer)', 'group_private.control_session(uuid,text)',
 'group_private.read_session_state(uuid)', 'group_private.read_session_state_month(uuid)',
 'public.guard_bill_publication()', 'public.initialize_fresh_bill_schedule()']) signature ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION cms_private.publication_rule(p_code text) RETURNS jsonb
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
SELECT jsonb_build_object('code',code,'severity',severity,'description',description,'basis',basis)
FROM (VALUES
('PUB-STATE','blocker','Target must be the selected CMS-owned workspace and unpublished draft, with valid status/timestamp/ownership. Prevent publication of arbitrary editions or reuse as lifecycle reassignment.','P; V, E: draft isolation.'),
('PUB-ACCESS','blocker','Recheck authenticated active staff inside protected operations, including retries; no browser DML or maintenance bypass.','P; V, E: authorization.'),
('PUB-STALE-REVIEW','blocker','Expected saved revision, validator version or either observed publication head changed. Review again; a changed head does not automatically prove permanent draft obsolescence.','P, H, G; V, R: concurrent-review binding.'),
('PUB-ORDER','blocker','Draft number is not strictly greater than the highest published number, or final server timestamp would leave either default selector pointing elsewhere. No renumbering or selector workaround.','P, H, G; V; E: current task''s overtaken-draft protection.'),
('PUB-HISTORY','blocker','Draft already has gameplay/historical dependencies, including inbound run/session/response/financial references. It must remain an isolated authoring workspace, not alter already-used content.','P and protected deletion/save dependencies; V, E: historical isolation.'),
('REL-EDITION','blocker','Across all twelve copied tables, reject orphaned or cross-edition owned links and incorrect owner versions, including choice destination metadata, fact/statistic/support/bill links and persona job references. Shared category/CAC registries are shared, not mismatches.','P, B, F, J; V, E. Single-column historical FKs do not enforce every version pairing.'),
('REL-CONSTRAINT','blocker','Stored content must satisfy actual required schema constraints and a valid transition must not fail existing guards. Apply real null/legacy allowances, not invented stricter rules.','P, B, F, J; V.'),
('PER-CATALOG','blocker','At least one persona can be offered; every offered persona must be valid. No enabled flag exists to hide an incomplete persona, and one bad row breaks the setup loader.','H; V.'),
('PER-DETAILS','blocker','Offered personas need nonblank name/description and usable finite exact starting balance compatible with the existing authoring/financial contract. Missing description or money fails loading; negative balance is outside the approved CMS monetary contract.','H, E; V, E.'),
('PER-EMPLOYMENT','blocker','Explicit English/computer booleans, null starting job and zero coalesced starting weekly income. Null weekly income is accepted as zero, as the current loader does. Do not edit these values automatically.','H, E; V, E: all households start unemployed.'),
('JOB-STARTABLE-CATALOG','blocker','At least two active, approved jobs explicitly require neither English nor computer skills, permitting initialization and fallback. This count comes from the actual initialize RPC.','E; V.'),
('JOB-VISIBLE-VALID','blocker','All active/approved jobs must pass current job loaders and application checks: required text/year, finite usable wage/generated gross/hours and explicit skill flags; retain real DB active prerequisites. Inactive/unapproved incomplete jobs do not fail this rule.','H, E, J; V. No generated-income input or new qualifications.'),
('SCN-PLAYABLE-CONTENT','blocker','Any canonical reachable ordinary scenario needs title, description, category, supported schedule and usable choices. Validate all loaded choice texts, response texts and exact direct-effect/upfront money because the loader parses all choices before mode filtering.','S; V.'),
('SCN-ANSWER-AVAILABLE','blocker','Each reachable ordinary event needs a selectable answer in each applicable support path, including a non-CAC answer without support. Do not require an affordable answer: approved early endings are valid gameplay.','S, A; V, E.'),
('SCN-UNSUPPORTED-EFFECT','blocker','A selectable ordinary answer must not have a `cac_support_effects` record that individual submission explicitly rejects. Preserve/report it; never convert or remove it.','S; V.'),
('SCN-ROUTE-COVERAGE','blocker','Continuing canonical routes cannot exhaust eligible unused scenarios. Legacy scheduled-only routes must not have ambiguous same-day candidates. Use the actual selector and all relevant hiring/support paths, not raw catalog counts.','S, E; V. Coverage proof below.'),
('EXP-DEFINITION','blocker','All persona expense definitions must have matching edition/persona and existing valid name, exact amount/fixed fee and first-day/interval semantics. Calculated occurrences and run state are never authored.','B; V, E.'),
('EXP-SCENARIO-COLLISION','blocker','Any scenario/expense pairing rejected by the existing publication guard blocks publication, even if metadata marks the scenario disabled. The guard ignores those flags; pretending otherwise would fail the transaction.','B; V. This is an actual database restriction, not proof that dormant content is playable.'),
('FACT-STORED-VALID','blocker','Existing fact rows must preserve valid schema identity/role/key/text/source and owner relationships. HTTPS source and no unresolved braces are real constraints. Evidence must remain present as stored; no invented evidence schema or attestation.','F, P; V.'),
('FACT-ACTIVE-ROLES','blocker','Canonical active scenario content needs one general and one CAC authored fact under the established content contract. PK enforces at most one, not presence. Dormant incomplete records are treated below. Both roles can remain ineligible; this is not a requirement to display them.','A; E. Presence is an authoring requirement, not a runtime error on empty facts.'),
('FACT-GENERAL-CONFLICT','blocker','Proven co-display of the same eligible general semantic fact on distinct canonical events conflicts with established non-repetition. Distinguish authored cross-scenario conflicts from repeated RPC event reuse, which is a platform issue. Do not reject mutually exclusive reuse or suppress/repair facts.','A, F; E; V: runtime lacks history enforcement.'),
('TAX-CONFIGURATION','blocker','Each persona/support path must have identified mandatory D005 configuration eligible for a scheduled ordinary occurrence. Missing, disabled, non-ordinary or unscheduled-only D005 does not meet the existing requirement.','A, S; E, V. No new exact day.'),
('TAX-EXACTLY-ONCE','blocker','On complete canonical routes, the configured tax event must occur once, without bill/employment conflict or a competing non-tax scheduled answer event that can displace it. Early-ended runs need not reach a later event.','A, S, B; E, V.'),
('PUB-MANDATORY-UNPROVEN','blocker','Required structural route/tax/declared-semantic-key claims cannot be established with the actual data and bounded analysis. Do not label uncertainty as a pass. This does not require mechanical proof of factual truth or new evidence attestations; limited text/source inference remains a warning.','A; E mandatory guarantees, R fail-closed proof mechanism.'),
('PUB-SUPPORTED-MODE-FAILURE','blocker','A known failure prevents safe execution of this canonical edition in a declared supported demo mode. A group implementation failure is a **demo readiness hold**, not a group-specific content standard. Resolve the implementation or obtain explicit supported-mode scope authorization.','Current task; E. G supplies verified failure evidence.'),
('SCN-DORMANT-INCOMPLETE','warning','Explicitly disabled ordinary catalog content, proven outside canonical decisions and recap lookup, lacks text/choices/fact roles. Retain it without a completeness blocker. Structural constraints still apply.','Current task, S, F; E clarification, R diagnostic.'),
('SCN-UNEXPECTED-EXCLUSION','warning','General/unassigned scenarios, missing metadata in a library edition, unsupported schedule/day or unreachable employment gating make intended ordinary content unavailable. Absence from routing is not automatic intentional dormancy. Escalate only when a blocker such as coverage or tax actually fails.','S; V, R.'),
('SCN-SCHEDULE-ALTERNATIVES','warning','Multiple library scenarios can compete for a day, so each is not guaranteed to occur. This alone is allowed; tax displacement and legacy ambiguity have hard rules above.','S; V, R.'),
('SCN-CONDITIONAL-DAY','warning','An ordinary Day-2 slot is excluded, and Day 3 depends on hiring. Slots beyond the calendar or on skipped paths do not imply guaranteed content.','S, E; V, R.'),
('SCN-DORMANCY-UNCERTAIN','warning','Cannot establish that content is excluded from relevant canonical decision/recap paths. Do not grant a dormant exemption. Apply actual reachable requirements conservatively and identify the uncertainty.','S, F; R.'),
('FACT-DISPLAY-INELIGIBLE','warning','Existing role is `verified=false`, or no eligible fact remains for an event/support mode. Gameplay accepts an empty fact list. Do not turn eligibility on or invent fallback copy.','F; V, R.'),
('FACT-PROVENANCE-LIMITED','warning','Reporting period absent, evidence empty/unstructured, or structured source/text linkage cannot be verified mechanically. This is not attestation or a reason to edit read-only statistics.','F, CMS fact contract; V, R.'),
('FACT-VARIETY-UNCERTAIN','warning','Semantic equivalence or co-reachability cannot be inferred reliably from text/evidence, or ineligible general copy would conflict if later enabled. No automatic text comparison becomes authoritative. Proven mandatory uncertainty/conflicts use hard rules above.','A, F; V, R.'),
('FACT-CAC-REUSE','warning','CAC facts reuse a relevant semantic measure. Repetition is allowed when its relevant pool is exhausted; prefer variety without replacing facts or requiring new services.','A; E, R diagnostic.'),
('EXP-OUTSIDE-CALENDAR','warning','First due day is after 30, so no bill occurrence is produced in the simulation. It is valid under existing expense constraints.','B; V, R.'),
('EXP-RECAP-MISSING','warning','Expense has no context link or event copy. Bills still work financially; do not create links or facts.','B, F; V, R.'),
('SCN-DORMANT-EFFECT','warning','Unsupported support-effect data exists only on proven dormant ordinary content. Report preserved legacy data; do not activate or rewrite it.','S; V, R.'),
('PUB-SOURCE-BEHIND','warning','Draft was copied from an older source than the current canonical default. Show source/current edition and changes, without automatic rebasing. Source age alone is not the previously defined numeric-order prohibition.','P, H; V, R.'),
('PLATFORM-GROUP-DIVERGENCE','warning','Current group routing, availability, recap or effects differ from canonical behavior. Document implementation ownership; promote actual supported-demo failures to the readiness hold, not to a new content-authoring rule.','G, S, F; V, E canonical clarification.'),
('PLATFORM-FACT-HISTORY','warning','Runtime has no persistent semantic display history; repeated event lookups can redisplay facts and no random/history service guarantees variety. Report actual conflict with mandatory behavior as a readiness issue when applicable.','F, A; V, E.'),
('INFO-EDITION-SNAPSHOT','information','Saved revision, source, authoring counts and both current selection heads. Confirms what is being reviewed.','P, H, G; V, R.'),
('INFO-CONTENT-REACHABILITY','information','Counts/lists by canonical decision, employment recap, bill recap and dormant/unexpectedly excluded content. Prevent mistaken catalog-size assumptions.','S, F; V, R.'),
('INFO-FACT-DISPLAY','information','Eligible general copy is returned for the event; CAC copy additionally needs support mode. No eligible result means an empty area. Existing `fact`/`context` headings differ.','F; V.'),
('JOB-OPTIONAL-METADATA','information','Entry education, related experience, on-the-job training or requirements note is absent/non-text legacy metadata. No loader/eligibility requirement is inferred.','H, J; V; E: deferred fields.'),
('INFO-INACTIVE-JOBS','information','Inactive/unapproved incomplete jobs are retained, not exposed as currently playable jobs.','H, J; V.'),
('INFO-GENERATED-INCOME','information','PostgreSQL generates weekly gross; no publication recalculation or editing of persona starting income/job assignment.','J, E; V, E.'),
('INFO-NEXT-METADATA','information','`next_scenario_id` is stored, edition-validated metadata; no routing, required outgoing edge or acyclic-graph rule exists.','S, P; V.'),
('INFO-SHARED-REFERENCES','information','Categories/CAC registries remain shared; statistics are read-only; evidence does not automatically bind copy to statistics.','P, F; V, E.'),
('INFO-PRESERVATION','information','Published/source content and historical runs stay pinned; new drafts remap identities. No silent repairs or historical edits.','P, B; V, E.'),
('INFO-NUMBER-CAPACITY','information','Edition numbers are smallint and draft creation uses max+1. Near/exhausted capacity affects **new draft creation**, not in-place publication of an already allocated valid number.','P; V, R.'),
('INFO-LEGACY-PRICE-DATA','information','`scenario_edition_prices` is copied compatibility data; inspected local employment uses its existing clothing constant. Do not invent a price binding or new preflight requirement.','E, `tools/local_sql/cms_price_compatibility.sql`; V limited to inspected code.')) rules(code,severity,description,basis) WHERE code=p_code
$$;
CREATE OR REPLACE FUNCTION cms_private.publication_finding(p_code text,p_affected jsonb,p_message text DEFAULT NULL,p_origin text DEFAULT 'content') RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE rule jsonb:=cms_private.publication_rule(p_code); BEGIN
 IF rule IS NULL THEN RAISE EXCEPTION 'Unknown publication rule %',p_code; END IF;
 RETURN rule||jsonb_build_object('affected',p_affected,'message',coalesce(p_message,rule->>'description'),'origin',p_origin);
END $$;
CREATE OR REPLACE FUNCTION cms_private.publication_heads() RETURNS jsonb
LANGUAGE sql STABLE SET search_path='' AS $$
SELECT jsonb_build_object('individual',(SELECT version_id FROM public.content_versions WHERE status='published' AND published_at IS NOT NULL ORDER BY version_number DESC LIMIT 1),
 'group',(SELECT version_id FROM public.content_versions WHERE status='published' AND published_at IS NOT NULL ORDER BY published_at DESC,version_id LIMIT 1))
$$;
CREATE OR REPLACE FUNCTION cms_private.publication_money(n numeric) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT coalesce(n::text NOT IN ('NaN','Infinity','-Infinity') AND n=round(n,2) AND abs(n)*100<=9007199254740991,false)
$$;
CREATE OR REPLACE FUNCTION cms_private.publication_route(v uuid,p uuid,h integer)
RETURNS TABLE(day integer,candidates uuid[],scheduled boolean)
LANGUAGE sql STABLE SET search_path='' AS $$
WITH lib AS (SELECT EXISTS(SELECT 1 FROM public.scenario_library_metadata WHERE version_id=v) yes),
 days AS (SELECT d FROM generate_series(1,30) d WHERE d<>2 AND (d<>3 OR h=2)
 AND NOT EXISTS(SELECT 1 FROM public.persona_expenses e WHERE e.version_id=v AND e.persona_id=p AND e.first_due_day<=d
  AND (e.first_due_day=d OR (e.repeat_interval_days IS NOT NULL AND (d-e.first_due_day)%nullif(e.repeat_interval_days,0)=0)))),
 sets AS (SELECT d,coalesce(array_agg(s.scenario_id ORDER BY s.scenario_id) FILTER(WHERE s.schedule_type='scheduled' AND s.default_day=d),'{}'::uuid[]) ss,
 coalesce(array_agg(s.scenario_id ORDER BY s.scenario_id) FILTER(WHERE lib.yes AND s.schedule_type='non_scheduled' AND m.library_key<>'D005'),'{}'::uuid[]) pool
 FROM days CROSS JOIN lib LEFT JOIN public.scenarios s ON s.version_id=v AND s.persona_intent=p
 LEFT JOIN public.scenario_library_metadata m ON m.scenario_id=s.scenario_id AND m.version_id=v
 WHERE NOT lib.yes OR s.scenario_id IS NULL OR (m.enabled AND m.engine='ordinary' AND (NOT m.requires_employment OR d>1))
 GROUP BY d)
-- Reintroduce days for which the WHERE clause removed every scenario.
SELECT d.d,coalesce(CASE WHEN cardinality(sets.ss)>0 THEN sets.ss ELSE sets.pool END,'{}'::uuid[]),coalesce(cardinality(sets.ss)>0,false)
FROM days d LEFT JOIN sets ON sets.d=d.d ORDER BY d.d
$$;
CREATE OR REPLACE FUNCTION cms_private.publication_events(v uuid)
RETURNS TABLE(scenario_id uuid,persona_id uuid,day integer,hired_day integer,context text)
LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT sid,p.persona_id,r.day,h,'ordinary' FROM public.personas p CROSS JOIN (VALUES(2),(3)) branches(h)
 CROSS JOIN LATERAL cms_private.publication_route(v,p.persona_id,h) r CROSS JOIN LATERAL unnest(r.candidates) sid WHERE p.version_id=v
 UNION ALL
 SELECT s.scenario_id,p.persona_id,CASE m.library_key WHEN 'D001' THEN 0 WHEN 'D002' THEN 2 WHEN 'D003' THEN 2 ELSE 3 END,h,'employment:'||m.library_key
 FROM public.personas p JOIN public.scenarios s ON s.persona_intent=p.persona_id AND s.version_id=v
 JOIN public.scenario_library_metadata m ON m.scenario_id=s.scenario_id AND m.version_id=v
 CROSS JOIN (VALUES(2),(3)) branches(h) WHERE p.version_id=v AND m.library_key IN ('D001','D002','D003','D004')
 AND (h=3 OR m.library_key IN ('D001','D002'))
 UNION ALL
 SELECT l.scenario_id,e.persona_id,d,h,'bill:'||e.expense_id::text FROM public.persona_expenses e
 JOIN public.scenario_bill_links l ON l.expense_id=e.expense_id AND l.version_id=v
 CROSS JOIN LATERAL generate_series(e.first_due_day::integer,30,coalesce(nullif(e.repeat_interval_days,0)::integer,31)) d
 CROSS JOIN (VALUES(2),(3)) branches(h) WHERE e.version_id=v
$$;
CREATE OR REPLACE FUNCTION cms_private.publication_group_questions(v uuid,p uuid) RETURNS SETOF public.scenarios
LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT d.* FROM (SELECT DISTINCT ON(lower(q.title),coalesce(q.description,'')) q.* FROM public.scenarios q
 WHERE q.version_id=v AND (q.persona_intent=p OR q.persona_intent IS NULL)
 AND EXISTS(SELECT 1 FROM public.choices c WHERE c.scenario_id=q.scenario_id AND c.version_id=v)
 ORDER BY lower(q.title),coalesce(q.description,''),q.scenario_id) d
 ORDER BY d.default_day NULLS LAST,lower(d.title),d.scenario_id LIMIT 30
$$;
CREATE OR REPLACE FUNCTION public.cms_publication_preflight(p_version uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE
 w cms_private.workspaces; v public.content_versions; f jsonb:='[]'; heads jsonb; active uuid[]; ordinary uuid[];
 p record; s record; x record; ch record; e record; h integer; route record; lib boolean; pool uuid[]; needed integer; available integer;
 owned text[]:=ARRAY['jobs','personas','scenarios','choices','persona_expenses','statistics','scenario_statistics','cac_support_effects','scenario_library_metadata','scenario_fact_copy','scenario_bill_links','scenario_edition_prices'];
 minimum_balance numeric; group_position integer; delta numeric;
 t text; pk text; joins text; violations jsonb; rows_count integer; own_pred text; field record; bad boolean;
BEGIN
 PERFORM cms_private.require_staff();
 SELECT * INTO STRICT w FROM cms_private.workspaces WHERE version_id=p_version;
 SELECT * INTO STRICT v FROM public.content_versions WHERE version_id=p_version;
 heads:=cms_private.publication_heads();
 FOR x IN SELECT * FROM cms_private.publication_runtime_contract WHERE to_regprocedure(signature) IS NULL OR md5(pg_get_functiondef(to_regprocedure(signature))) IS DISTINCT FROM definition_hash LOOP
  f:=f||jsonb_build_array(cms_private.publication_finding('PUB-MANDATORY-UNPROVEN',jsonb_build_array(to_jsonb(x)),'Gameplay functions changed since this validator was reviewed. Revalidate the contract before publication.','platform'));
 END LOOP;

 SELECT EXISTS(SELECT 1 FROM public.scenario_library_metadata WHERE version_id=p_version) INTO lib;
 SELECT coalesce(array_agg(DISTINCT scenario_id),'{}'::uuid[]) INTO active FROM cms_private.publication_events(p_version);
 SELECT coalesce(array_agg(DISTINCT scenario_id),'{}'::uuid[]) INTO ordinary FROM cms_private.publication_events(p_version) WHERE context='ordinary';
 IF NOT v.cms_managed OR v.status IS DISTINCT FROM 'draft' OR v.published_at IS NOT NULL THEN
  f:=f||jsonb_build_array(cms_private.publication_finding('PUB-STATE',jsonb_build_array(to_jsonb(v)),'This workspace is not an unpublished CMS draft.','database')); END IF;
 IF EXISTS(SELECT 1 FROM public.content_versions WHERE status='published' AND published_at IS NOT NULL AND version_number>=v.version_number)
 OR EXISTS(SELECT 1 FROM public.content_versions WHERE status='published' AND published_at>clock_timestamp()) THEN
  f:=f||jsonb_build_array(cms_private.publication_finding('PUB-ORDER',jsonb_build_array(jsonb_build_object('version_id',p_version,'version_number',v.version_number,'heads',heads)),'The edition has been overtaken, or a future publication timestamp prevents a shared default. Create a fresh draft from the latest canonical published edition.','database')); END IF;
 IF w.source_version::text IS DISTINCT FROM heads->>'individual' THEN
  f:=f||jsonb_build_array(cms_private.publication_finding('PUB-SOURCE-BEHIND',jsonb_build_array(jsonb_build_object('source_version',w.source_version,'current_version',heads->'individual')))); END IF;
 -- Catalogue-backed FK traversal includes owned references not exposed by the editors.
 FOR x IN SELECT c.* FROM pg_constraint c WHERE c.contype='f' AND c.connamespace='public'::regnamespace
 AND (c.conrelid=ANY(SELECT ('public.'||a)::regclass FROM unnest(owned) a)
  OR c.confrelid=ANY(SELECT ('public.'||a)::regclass FROM unnest(owned||ARRAY['content_versions']) a)) LOOP
  SELECT string_agg(format('c.%I=r.%I',ca.attname,pa.attname),' AND '),string_agg(format('c.%I IS NOT NULL',ca.attname),' AND ')
  INTO joins,own_pred FROM unnest(x.conkey,x.confkey) k(ca,pa)
  JOIN pg_attribute ca ON ca.attrelid=x.conrelid AND ca.attnum=k.ca JOIN pg_attribute pa ON pa.attrelid=x.confrelid AND pa.attnum=k.pa;
  IF x.conrelid=ANY(SELECT ('public.'||a)::regclass FROM unnest(owned) a) THEN
   IF x.confrelid=ANY(SELECT ('public.'||a)::regclass FROM unnest(owned) a) THEN
    EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(c)),''[]''::jsonb) FROM %s c LEFT JOIN %s r ON %s WHERE c.version_id=$1 AND (%s) AND (r.version_id IS DISTINCT FROM $1)',x.conrelid::regclass,x.confrelid::regclass,joins,own_pred) INTO violations USING p_version;
    IF jsonb_array_length(violations)>0 THEN f:=f||jsonb_build_array(cms_private.publication_finding('REL-EDITION',violations,'Owned relationship mismatch: '||x.conname,'database')); END IF;
   END IF;
  ELSIF x.conrelid::regclass::text NOT LIKE 'cms_private.%' THEN
   -- Any external FK into this edition's content is historical/non-authoring use.
   EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(c)),''[]''::jsonb) FROM %s c JOIN %s r ON %s WHERE r.version_id=$1',x.conrelid::regclass,x.confrelid::regclass,joins) INTO violations USING p_version;
   IF jsonb_array_length(violations)>0 THEN
    f:=f||jsonb_build_array(cms_private.publication_finding('PUB-HISTORY',violations,'External dependency: '||x.conrelid::regclass::text,'database')); END IF;
  END IF;
 END LOOP;
 -- Validate all stored CHECK constraints, respecting real nullable/legacy semantics.
 FOREACH t IN ARRAY owned LOOP
  FOR x IN SELECT conname,pg_get_expr(conbin,conrelid) expression FROM pg_constraint WHERE conrelid=('public.'||t)::regclass AND contype='c' LOOP
   EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(c)),''[]''::jsonb) FROM public.%I c WHERE version_id=$1 AND (%s) IS FALSE',t,x.expression) INTO violations USING p_version;
   IF jsonb_array_length(violations)>0 THEN f:=f||jsonb_build_array(cms_private.publication_finding('REL-CONSTRAINT',violations,t||'.'||x.conname,'database')); END IF;
  END LOOP;
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM public.personas WHERE version_id=p_version) THEN
  f:=f||jsonb_build_array(cms_private.publication_finding('PER-CATALOG',jsonb_build_array(jsonb_build_object('version_id',p_version)))); END IF;
 FOR p IN SELECT * FROM public.personas WHERE version_id=p_version ORDER BY persona_id LOOP
  IF nullif(btrim(p.name),'') IS NULL OR nullif(btrim(p.description),'') IS NULL OR NOT cms_private.publication_money(p.general_starting_balance) OR p.general_starting_balance<0 THEN
   f:=f||jsonb_build_array(cms_private.publication_finding('PER-DETAILS',jsonb_build_array(to_jsonb(p)))); END IF;
  IF p.starting_job_id IS NOT NULL OR p.weekly_income IS NOT NULL AND p.weekly_income<>0 OR p.has_english_skills IS NULL OR p.has_computer_skills IS NULL THEN
   f:=f||jsonb_build_array(cms_private.publication_finding('PER-EMPLOYMENT',jsonb_build_array(to_jsonb(p)))); END IF;
  IF p.general_starting_balance>=0 AND p.general_starting_balance<60 THEN
   f:=f||jsonb_build_array(cms_private.publication_finding('PUB-SUPPORTED-MODE-FAILURE',jsonb_build_array(jsonb_build_object('persona_id',p.persona_id,'name',p.name,'diagnostic','GROUP-EFFECT-DIVERGENCE')),'An unaffordable clothing purchase ends an individual run but group rejects it without that ending. This is a gameplay mismatch, not a requirement to increase the authored starting balance.','platform')); END IF;
  FOREACH h IN ARRAY ARRAY[2,3] LOOP
   needed:=0; pool:='{}';
   FOR route IN SELECT * FROM cms_private.publication_route(p_version,p.persona_id,h) LOOP
    IF NOT lib AND cardinality(route.candidates)>1 THEN
     f:=f||jsonb_build_array(cms_private.publication_finding('SCN-ROUTE-COVERAGE',jsonb_build_array(jsonb_build_object('persona_id',p.persona_id,'day',route.day,'hired_day',h,'scenario_ids',route.candidates)),'Legacy scheduled day has multiple candidates.')); END IF;
    IF lib AND NOT route.scheduled THEN
     needed:=needed+1;
     SELECT coalesce(array_agg(DISTINCT z),'{}') INTO pool FROM unnest(pool||route.candidates) z;
     IF cardinality(pool)<needed OR cardinality(route.candidates)=0 THEN
      f:=f||jsonb_build_array(cms_private.publication_finding('SCN-ROUTE-COVERAGE',jsonb_build_array(jsonb_build_object('persona_id',p.persona_id,'day',route.day,'hired_day',h,'scenario_ids',route.candidates,'needed',needed,'available',cardinality(pool))),'Insufficient eligible unused pool capacity for this continuing route.')); EXIT; END IF;
    END IF;
    IF route.scheduled AND cardinality(route.candidates)>1 THEN
     f:=f||jsonb_build_array(cms_private.publication_finding('SCN-SCHEDULE-ALTERNATIVES',jsonb_build_array(jsonb_build_object('persona_id',p.persona_id,'day',route.day,'scenario_ids',route.candidates)))); END IF;
   END LOOP;
   SELECT count(*) INTO rows_count FROM public.scenarios sc JOIN public.scenario_library_metadata m USING(scenario_id,version_id)
    WHERE sc.version_id=p_version AND sc.persona_intent=p.persona_id AND m.library_key='D005' AND m.enabled AND m.engine='ordinary' AND sc.schedule_type='scheduled'
      AND EXISTS(SELECT 1 FROM cms_private.publication_route(p_version,p.persona_id,h) r WHERE sc.scenario_id=ANY(r.candidates));
   IF rows_count=0 THEN
    f:=f||jsonb_build_array(cms_private.publication_finding('TAX-CONFIGURATION',jsonb_build_array(jsonb_build_object('persona_id',p.persona_id,'hired_day',h,'library_key','D005')),'No reachable scheduled mandatory tax configuration exists on this route.'));
   ELSE
    SELECT count(*) INTO rows_count FROM cms_private.publication_route(p_version,p.persona_id,h) r WHERE r.scheduled AND cardinality(r.candidates)>0
    AND NOT EXISTS(SELECT 1 FROM unnest(r.candidates) sid LEFT JOIN public.scenario_library_metadata m ON m.scenario_id=sid AND m.version_id=p_version WHERE m.library_key IS DISTINCT FROM 'D005');
    IF rows_count<>1 OR EXISTS(SELECT 1 FROM cms_private.publication_route(p_version,p.persona_id,h) r JOIN public.scenario_library_metadata m ON m.scenario_id=ANY(r.candidates) AND m.version_id=p_version WHERE m.library_key='D005' AND (NOT r.scheduled OR EXISTS(SELECT 1 FROM unnest(r.candidates) sid JOIN public.scenario_library_metadata other ON other.scenario_id=sid WHERE other.library_key<>'D005'))) THEN
     f:=f||jsonb_build_array(cms_private.publication_finding('TAX-EXACTLY-ONCE',jsonb_build_array(jsonb_build_object('persona_id',p.persona_id,'hired_day',h)),'Tax must occupy exactly one guaranteed existing scheduled slot, without competing non-tax content.')); END IF;
   END IF;
  END LOOP;
  -- Diagnose actual group failures. This is a platform hold, never a 30-card authoring standard.
  SELECT count(*) INTO rows_count FROM cms_private.publication_group_questions(p_version,p.persona_id);
  IF rows_count<>30 THEN
   f:=f||jsonb_build_array(cms_private.publication_finding('PUB-SUPPORTED-MODE-FAILURE',jsonb_build_array(jsonb_build_object('persona_id',p.persona_id,'question_count',rows_count,'diagnostic','GROUP-QUESTION-SEQUENCE')),'Current group start refuses this canonical edition because its independent query does not return 30 questions. Group alignment needs separate authorization; do not author group-only filler.','platform'));
  END IF;
  SELECT count(*) INTO rows_count FROM cms_private.publication_group_questions(p_version,p.persona_id) q JOIN public.scenario_library_metadata m USING(scenario_id,version_id) WHERE m.library_key='D005';
  IF rows_count<>1 THEN
   f:=f||jsonb_build_array(cms_private.publication_finding('PUB-SUPPORTED-MODE-FAILURE',jsonb_build_array(jsonb_build_object('persona_id',p.persona_id,'tax_count',rows_count,'diagnostic','GROUP-QUESTION-SEQUENCE')),'Group sequence cannot demonstrate exactly-once mandatory tax inclusion.','platform')); END IF;
  minimum_balance:=CASE WHEN p.general_starting_balance>=60 THEN p.general_starting_balance-60 ELSE p.general_starting_balance END;
  group_position:=0;
  FOR s IN SELECT * FROM cms_private.publication_group_questions(p_version,p.persona_id) ORDER BY default_day NULLS LAST,lower(title),scenario_id LOOP
   group_position:=group_position+1;
   SELECT min(coalesce(balance_change,0)) INTO delta FROM public.choices WHERE scenario_id=s.scenario_id AND version_id=p_version;
   minimum_balance:=minimum_balance+coalesce(delta,0);
   IF minimum_balance<0 THEN
    f:=f||jsonb_build_array(cms_private.publication_finding('PUB-SUPPORTED-MODE-FAILURE',jsonb_build_array(jsonb_build_object('persona_id',p.persona_id,'scenario_id',s.scenario_id,'question_number',group_position,'possible_balance',minimum_balance,'diagnostic','GROUP-EFFECT-DIVERGENCE')),'Group can apply an unaffordable winning choice and continue with a negative balance, unlike canonical protected submission.','platform')); EXIT; END IF;
   IF EXISTS(SELECT 1 FROM public.choices WHERE scenario_id=s.scenario_id AND version_id=p_version AND (nullif(btrim(choice_text),'') IS NULL OR NOT cms_private.publication_money(balance_change))) THEN
    f:=f||jsonb_build_array(cms_private.publication_finding('PUB-SUPPORTED-MODE-FAILURE',jsonb_build_array(to_jsonb(s)),'Group exposes unusable choice content (including potentially dormant content). Group alignment needs separate authorization.','platform')); END IF;
  END LOOP;
  FOR s IN SELECT * FROM cms_private.publication_group_questions(p_version,p.persona_id) q WHERE q.scenario_id<>ALL(ordinary) LOOP
   f:=f||jsonb_build_array(cms_private.publication_finding('PLATFORM-GROUP-DIVERGENCE',jsonb_build_array(to_jsonb(s)),'Group selects content outside canonical ordinary selection (general, dormant, context-only or otherwise excluded).','platform'));
   IF nullif(btrim(s.title),'') IS NULL OR nullif(btrim(s.description),'') IS NULL THEN
    f:=f||jsonb_build_array(cms_private.publication_finding('PUB-SUPPORTED-MODE-FAILURE',jsonb_build_array(to_jsonb(s)),'Group exposes incomplete non-canonical content. Fix group selection, not dormant authoring.','platform')); END IF;
  END LOOP;
 END LOOP;
 SELECT count(*) INTO rows_count FROM public.jobs WHERE version_id=p_version AND is_active AND is_approved AND needs_english_skills=false AND needs_computer_skills=false;
 IF rows_count<2 THEN f:=f||jsonb_build_array(cms_private.publication_finding('JOB-STARTABLE-CATALOG',jsonb_build_array(jsonb_build_object('version_id',p_version,'eligible_job_count',rows_count)))); END IF;
 FOR x IN SELECT * FROM public.jobs WHERE version_id=p_version ORDER BY job_id LOOP
  IF cms_private.job_history(p_version,x.job_id) THEN
   f:=f||jsonb_build_array(cms_private.publication_finding('PUB-HISTORY',jsonb_build_array(jsonb_build_object('job_id',x.job_id,'title',x.title)),'A job is referenced by historical employment JSON, a run, group or vote.','database')); END IF;
  IF x.is_active AND x.is_approved THEN
   IF nullif(btrim(x.title),'') IS NULL OR nullif(btrim(x.soc_code),'') IS NULL OR nullif(btrim(x.area_name),'') IS NULL OR nullif(btrim(x.wage_source_url),'') IS NULL
    OR x.wage_year IS NULL OR NOT cms_private.publication_money(x.median_hourly_wage) OR NOT cms_private.publication_money(x.weekly_gross_income) OR x.hours_per_week::text IN ('NaN','Infinity','-Infinity')
    OR x.needs_english_skills IS NULL OR x.needs_computer_skills IS NULL THEN
     f:=f||jsonb_build_array(cms_private.publication_finding('JOB-VISIBLE-VALID',jsonb_build_array(to_jsonb(x)))); END IF;
   IF EXISTS(SELECT 1 FROM public.personas pe WHERE pe.version_id=p_version AND ((x.needs_english_skills AND NOT pe.has_english_skills) OR (x.needs_computer_skills AND NOT pe.has_computer_skills))) THEN
    f:=f||jsonb_build_array(cms_private.publication_finding('PUB-SUPPORTED-MODE-FAILURE',jsonb_build_array(jsonb_build_object('job_id',x.job_id,'title',x.title,'diagnostic','GROUP-EMPLOYMENT-DIVERGENCE')),'Group job voting permits jobs that canonical persona skill eligibility rejects on a no-support path.','platform')); END IF;
   IF x.weekly_gross_income>0 THEN
    f:=f||jsonb_build_array(cms_private.publication_finding('PUB-SUPPORTED-MODE-FAILURE',jsonb_build_array(jsonb_build_object('job_id',x.job_id,'title',x.title,'weekly_gross_income',x.weekly_gross_income,'diagnostic','GROUP-EFFECT-DIVERGENCE')),'Group stores weekly income but does not credit canonical weekly pay during its question progression. Positive-income demo paths need separately authorized group alignment.','platform')); END IF;
  ELSE f:=f||jsonb_build_array(cms_private.publication_finding('INFO-INACTIVE-JOBS',jsonb_build_array(jsonb_build_object('job_id',x.job_id,'title',x.title)))); END IF;
  IF x.entry_education IS NULL OR x.related_experience IS NULL OR x.on_job_training IS NULL OR jsonb_typeof(x.simulation_requirements->'notes') IS DISTINCT FROM 'string' THEN
   f:=f||jsonb_build_array(cms_private.publication_finding('JOB-OPTIONAL-METADATA',jsonb_build_array(jsonb_build_object('job_id',x.job_id,'title',x.title)))); END IF;
 END LOOP;
 FOR s IN SELECT sc.*,m.engine,m.enabled,m.library_key,m.requires_employment FROM public.scenarios sc LEFT JOIN public.scenario_library_metadata m USING(scenario_id,version_id) WHERE sc.version_id=p_version ORDER BY scenario_id LOOP
  IF s.scenario_id=ANY(ordinary) THEN
   IF nullif(btrim(s.title),'') IS NULL OR nullif(btrim(s.description),'') IS NULL OR s.category_id IS NULL OR s.schedule_type NOT IN ('scheduled','non_scheduled') THEN
    f:=f||jsonb_build_array(cms_private.publication_finding('SCN-PLAYABLE-CONTENT',jsonb_build_array(to_jsonb(s)))); END IF;
   IF NOT EXISTS(SELECT 1 FROM public.choices WHERE scenario_id=s.scenario_id AND version_id=p_version AND NOT requires_cac) THEN
    f:=f||jsonb_build_array(cms_private.publication_finding('SCN-ANSWER-AVAILABLE',jsonb_build_array(to_jsonb(s)),'No ordinary answer is available without CAC support.')); END IF;
  ELSIF NOT s.scenario_id=ANY(active) AND s.enabled IS FALSE AND s.engine='ordinary' THEN
   IF nullif(btrim(s.description),'') IS NULL OR NOT EXISTS(SELECT 1 FROM public.choices WHERE scenario_id=s.scenario_id) OR (SELECT count(*) FROM public.scenario_fact_copy WHERE scenario_id=s.scenario_id)<2 THEN
    f:=f||jsonb_build_array(cms_private.publication_finding('SCN-DORMANT-INCOMPLETE',jsonb_build_array(to_jsonb(s)))); END IF;
  ELSIF NOT s.scenario_id=ANY(active) THEN
   f:=f||jsonb_build_array(cms_private.publication_finding('SCN-UNEXPECTED-EXCLUSION',jsonb_build_array(to_jsonb(s)))); END IF;
  IF s.schedule_type='scheduled' AND (s.default_day IN (2,3) OR s.default_day NOT BETWEEN 1 AND 30) THEN
   f:=f||jsonb_build_array(cms_private.publication_finding('SCN-CONDITIONAL-DAY',jsonb_build_array(to_jsonb(s)))); END IF;
  IF s.scenario_id=ANY(active) THEN
   FOREACH t IN ARRAY ARRAY['general','cac'] LOOP
    IF NOT EXISTS(SELECT 1 FROM public.scenario_fact_copy WHERE scenario_id=s.scenario_id AND version_id=p_version AND fact_role=t) THEN
     f:=f||jsonb_build_array(cms_private.publication_finding('FACT-ACTIVE-ROLES',jsonb_build_array(jsonb_build_object('scenario_id',s.scenario_id,'title',s.title,'fact_role',t)))); END IF;
   END LOOP;
  END IF;
  FOR ch IN SELECT * FROM public.choices WHERE scenario_id=s.scenario_id AND version_id=p_version ORDER BY choice_id LOOP
   IF s.scenario_id=ANY(ordinary) AND (nullif(btrim(ch.choice_text),'') IS NULL OR nullif(btrim(ch.response_text),'') IS NULL OR NOT cms_private.publication_money(ch.balance_change) OR NOT cms_private.publication_money(ch.upfront_cost)) THEN
    f:=f||jsonb_build_array(cms_private.publication_finding('SCN-PLAYABLE-CONTENT',jsonb_build_array(to_jsonb(ch)))); END IF;
   IF EXISTS(SELECT 1 FROM public.cac_support_effects WHERE choice_id=ch.choice_id) THEN
    f:=f||jsonb_build_array(cms_private.publication_finding(CASE WHEN s.scenario_id=ANY(ordinary) THEN 'SCN-UNSUPPORTED-EFFECT' ELSE 'SCN-DORMANT-EFFECT' END,jsonb_build_array(to_jsonb(ch)))); END IF;
   IF ch.next_scenario_id IS NOT NULL THEN
    f:=f||jsonb_build_array(cms_private.publication_finding('INFO-NEXT-METADATA',jsonb_build_array(jsonb_build_object('choice_id',ch.choice_id,'next_scenario_id',ch.next_scenario_id)))); END IF;
   IF (ch.requires_cac OR ch.upfront_cost>0) AND EXISTS(SELECT 1 FROM public.personas pe CROSS JOIN LATERAL cms_private.publication_group_questions(p_version,pe.persona_id) q WHERE pe.version_id=p_version AND q.scenario_id=s.scenario_id) THEN
    f:=f||jsonb_build_array(cms_private.publication_finding('PUB-SUPPORTED-MODE-FAILURE',jsonb_build_array(to_jsonb(ch)),'Group exposes this choice without canonical CAC/upfront eligibility checks (GROUP-EFFECT-DIVERGENCE).','platform')); END IF;
  END LOOP;
 END LOOP;
 FOR e IN SELECT * FROM public.persona_expenses WHERE version_id=p_version ORDER BY expense_id LOOP
  IF NOT cms_private.publication_money(e.amount) OR NOT cms_private.publication_money(e.late_fee_amount) OR e.amount<0 OR e.late_fee_amount<0 OR e.first_due_day<1 OR e.repeat_interval_days<1 THEN
   f:=f||jsonb_build_array(cms_private.publication_finding('EXP-DEFINITION',jsonb_build_array(to_jsonb(e)))); END IF;
  IF e.first_due_day>30 THEN f:=f||jsonb_build_array(cms_private.publication_finding('EXP-OUTSIDE-CALENDAR',jsonb_build_array(to_jsonb(e))));
  ELSE
   f:=f||jsonb_build_array(cms_private.publication_finding('PUB-SUPPORTED-MODE-FAILURE',jsonb_build_array(to_jsonb(e)),'Group presents expense definitions but does not execute canonical bill payment/Ignore/late-fee handling (GROUP-EFFECT-DIVERGENCE).','platform')); END IF;
  IF NOT EXISTS(SELECT 1 FROM public.scenario_bill_links WHERE expense_id=e.expense_id AND version_id=p_version) THEN
   f:=f||jsonb_build_array(cms_private.publication_finding('EXP-RECAP-MISSING',jsonb_build_array(to_jsonb(e)))); END IF;
  FOR s IN SELECT * FROM public.scenarios WHERE version_id=p_version AND persona_intent=e.persona_id AND schedule_type='scheduled' AND default_day BETWEEN 1 AND 30 AND e.first_due_day<=default_day AND (e.first_due_day=default_day OR (e.repeat_interval_days IS NOT NULL AND (default_day-e.first_due_day)%nullif(e.repeat_interval_days,0)=0)) LOOP
   f:=f||jsonb_build_array(cms_private.publication_finding('EXP-SCENARIO-COLLISION',jsonb_build_array(to_jsonb(e),to_jsonb(s)),NULL,'database'));
  END LOOP;
 END LOOP;
 FOR x IN SELECT * FROM public.scenario_fact_copy WHERE version_id=p_version ORDER BY scenario_id,fact_role LOOP
  IF nullif(btrim(x.display_text),'') IS NULL OR x.display_text ~ '[{}]' OR x.source_url !~ '^https://' OR nullif(btrim(x.semantic_key),'') IS NULL THEN
   f:=f||jsonb_build_array(cms_private.publication_finding('FACT-STORED-VALID',jsonb_build_array(to_jsonb(x)))); END IF;
  IF NOT x.verified THEN f:=f||jsonb_build_array(cms_private.publication_finding('FACT-DISPLAY-INELIGIBLE',jsonb_build_array(to_jsonb(x)))); END IF;
  IF x.reporting_period IS NULL OR x.evidence='{}'::jsonb OR jsonb_typeof(x.evidence)<>'object' THEN
   f:=f||jsonb_build_array(cms_private.publication_finding('FACT-PROVENANCE-LIMITED',jsonb_build_array(jsonb_build_object('scenario_id',x.scenario_id,'fact_role',x.fact_role,'reporting_period',x.reporting_period)))); END IF;
 END LOOP;
 -- Semantic conflicts require a concrete same-persona/hiring-path, distinct-event witness.
 FOR x IN WITH events AS (
  SELECT scenario_id,persona_id,hired_day,context,array_agg(DISTINCT day) days FROM cms_private.publication_events(p_version) GROUP BY scenario_id,persona_id,hired_day,context
 ) SELECT DISTINCT a.persona_id,a.hired_day,a.scenario_id a_id,b.scenario_id b_id,a.context a_context,b.context b_context,fa.semantic_key
 FROM events a JOIN events b ON a.persona_id=b.persona_id AND a.hired_day=b.hired_day
 AND ((a.scenario_id,a.context)<(b.scenario_id,b.context) OR (a.scenario_id=b.scenario_id AND a.context=b.context AND a.context LIKE 'bill:%' AND cardinality(a.days)>1))
 AND EXISTS(SELECT 1 FROM unnest(a.days) da CROSS JOIN unnest(b.days) db WHERE da<>db)
 JOIN public.scenario_fact_copy fa ON fa.scenario_id=a.scenario_id AND fa.version_id=p_version AND fa.fact_role='general' AND fa.verified
 JOIN public.scenario_fact_copy fb ON fb.scenario_id=b.scenario_id AND fb.version_id=p_version AND fb.fact_role='general' AND fb.verified AND fb.semantic_key=fa.semantic_key
 ORDER BY a.persona_id,a.hired_day,a.scenario_id,b.scenario_id,a.context,b.context,fa.semantic_key LIMIT 200 LOOP
  f:=f||jsonb_build_array(cms_private.publication_finding('FACT-GENERAL-CONFLICT',jsonb_build_array(to_jsonb(x)),NULL,CASE WHEN x.a_id=x.b_id THEN 'platform' ELSE 'content' END));
 END LOOP;
 IF EXISTS(SELECT 1 FROM public.scenario_fact_copy fc JOIN public.scenario_library_metadata m USING(scenario_id,version_id) WHERE fc.version_id=p_version AND fc.fact_role='general' AND fc.verified AND m.library_key='D001' AND fc.scenario_id=ANY(active)) THEN
  f:=f||jsonb_build_array(cms_private.publication_finding('PUB-SUPPORTED-MODE-FAILURE',jsonb_build_array(jsonb_build_object('version_id',p_version,'event_key','D001')),'D001 can display the same eligible general fact during preparation and application; runtime has no fact display history. Separate remediation is required for mandatory non-repetition.','platform')); END IF;
 FOR x IN SELECT semantic_key,jsonb_agg(jsonb_build_object('scenario_id',scenario_id,'fact_role',fact_role)) affected FROM public.scenario_fact_copy WHERE version_id=p_version AND fact_role='cac' AND scenario_id=ANY(active) GROUP BY semantic_key HAVING count(*)>1 LOOP
  f:=f||jsonb_build_array(cms_private.publication_finding('FACT-CAC-REUSE',x.affected));
 END LOOP;
 FOR x IN SELECT display_text,jsonb_agg(jsonb_build_object('scenario_id',scenario_id,'fact_role',fact_role,'semantic_key',semantic_key)) affected FROM public.scenario_fact_copy WHERE version_id=p_version AND fact_role='general' AND scenario_id=ANY(active) GROUP BY display_text HAVING count(DISTINCT semantic_key)>1 LOOP
  f:=f||jsonb_build_array(cms_private.publication_finding('FACT-VARIETY-UNCERTAIN',x.affected,'Identical general copy has different declared semantic keys; no automatic equivalence decision was made.'));
 END LOOP;
 f:=f||jsonb_build_array(cms_private.publication_finding('INFO-CONTENT-REACHABILITY',jsonb_build_array(jsonb_build_object('version_id',p_version,'ordinary_scenario_ids',ordinary,'active_scenario_ids',active)),'Reachability covers the saved edition. At most 200 semantic conflict examples are shown; any conflict blocks publication.'));
 f:=f||jsonb_build_array(cms_private.publication_finding('INFO-FACT-DISPLAY',jsonb_build_array(jsonb_build_object('version_id',p_version,'eligible_count',(SELECT count(*) FROM public.scenario_fact_copy WHERE version_id=p_version AND verified)))));
 f:=f||jsonb_build_array(cms_private.publication_finding('INFO-GENERATED-INCOME',coalesce((SELECT jsonb_agg(jsonb_build_object('job_id',job_id,'weekly_gross_income',weekly_gross_income) ORDER BY job_id) FROM public.jobs WHERE version_id=p_version),'[]'::jsonb)));
 f:=f||jsonb_build_array(cms_private.publication_finding('INFO-SHARED-REFERENCES',jsonb_build_array(jsonb_build_object('version_id',p_version,'category_ids',(SELECT jsonb_agg(DISTINCT category_id) FROM public.scenarios WHERE version_id=p_version),'statistic_ids',(SELECT jsonb_agg(statistic_id ORDER BY statistic_id) FROM public.statistics WHERE version_id=p_version)))));
 f:=f||jsonb_build_array(cms_private.publication_finding('INFO-PRESERVATION',jsonb_build_array(jsonb_build_object('version_id',p_version,'source_version',w.source_version,'lineage_count',(SELECT count(*) FROM cms_private.lineage WHERE version_id=p_version)))));
 f:=f||jsonb_build_array(cms_private.publication_finding('INFO-NUMBER-CAPACITY',jsonb_build_array(jsonb_build_object('max_number',(SELECT max(version_number) FROM public.content_versions),'limit',32767))));
 IF EXISTS(SELECT 1 FROM public.scenario_edition_prices WHERE version_id=p_version) THEN
  f:=f||jsonb_build_array(cms_private.publication_finding('INFO-LEGACY-PRICE-DATA',jsonb_build_array(jsonb_build_object('version_id',p_version)))); END IF;
 f:=f||jsonb_build_array(cms_private.publication_finding('INFO-EDITION-SNAPSHOT',jsonb_build_array(jsonb_build_object('version_id',p_version,'revision',w.revision,'heads',heads,'scenario_count',(SELECT count(*) FROM public.scenarios WHERE version_id=p_version)))));
 f:=f||jsonb_build_array(cms_private.publication_finding('PLATFORM-GROUP-DIVERGENCE','[]','Group uses an independent question sequence, job interactions and recap path; these are implementation differences, not a second content contract.','platform'));
 f:=f||jsonb_build_array(cms_private.publication_finding('PLATFORM-FACT-HISTORY','[]',NULL,'platform'));
 -- Stable ordering and deduplication; no query-order or current-time fields in the report.
 SELECT coalesce(jsonb_agg(item ORDER BY item->>'severity',item->>'code',(item->'affected')::text),'[]') INTO f FROM (SELECT DISTINCT value item FROM jsonb_array_elements(f)) ordered;
 RETURN jsonb_build_object('version_id',p_version,'version_number',v.version_number,'revision',w.revision,'validator','cms-publication-v1','heads',heads,'findings',f,'can_publish',NOT EXISTS(SELECT 1 FROM jsonb_array_elements(f) finding WHERE finding->>'severity'='blocker'));
END $$;
REVOKE ALL ON FUNCTION cms_private.publication_rule(text),cms_private.publication_finding(text,jsonb,text,text),cms_private.publication_heads(),cms_private.publication_money(numeric),cms_private.publication_route(uuid,uuid,integer),cms_private.publication_events(uuid),cms_private.publication_group_questions(uuid,uuid),public.cms_publication_preflight(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cms_publication_preflight(uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
