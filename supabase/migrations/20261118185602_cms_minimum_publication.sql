-- Minimum viable canonical content contract. Forward-only; no content or gameplay writes.
BEGIN;
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
('SCN-PLAYABLE-CONTENT','warning','Selected scenario has incomplete narrative or choices. Optional scenario completeness is not a minimum-publication requirement; review before using this content.','November 18 minimum viable content policy; verified runtime and database contract.'),
('SCN-ANSWER-AVAILABLE','warning','Selected scenario has no answer available without support. Review its choices before testing that scenario.','November 18 minimum viable content policy; verified runtime and database contract.'),
('SCN-UNSUPPORTED-EFFECT','blocker','A selectable ordinary answer must not have a `cac_support_effects` record that individual submission explicitly rejects. Preserve/report it; never convert or remove it.','S; V.'),
('SCN-ROUTE-COVERAGE','warning','Optional scenario scheduling may exhaust its candidate pool or contain competing legacy slots. Review scheduling before testing this route; no filler scenarios are required.','November 18 minimum viable content policy; verified runtime and database contract.'),
('EXP-DEFINITION','blocker','All persona expense definitions must have matching edition/persona and existing valid name, exact amount/fixed fee and first-day/interval semantics. Calculated occurrences and run state are never authored.','B; V, E.'),
('EXP-SCENARIO-COLLISION','blocker','Any scenario/expense pairing rejected by the existing publication guard blocks publication, even if metadata marks the scenario disabled. The guard ignores those flags; pretending otherwise would fail the transaction.','B; V. This is an actual database restriction, not proof that dormant content is playable.'),
('FACT-STORED-VALID','blocker','Existing fact rows must preserve valid schema identity/role/key/text/source and owner relationships. HTTPS source and no unresolved braces are real constraints. Evidence must remain present as stored; no invented evidence schema or attestation.','F, P; V.'),
('FACT-ACTIVE-ROLES','warning','Scenario has no authored fact for this role. Facts are optional; gameplay displays no fact when none is eligible.','November 18 minimum viable content policy; verified runtime and database contract.'),
('FACT-GENERAL-CONFLICT','warning','The same eligible general fact may appear on multiple events. Repetition is allowed for minimum publication; review only if variety is desired.','November 18 minimum viable content policy; verified runtime and database contract.'),
('TAX-CONFIGURATION','warning','An authored tax scenario is not reachable in a scheduled ordinary slot. Tax scenarios are optional and no exact day is required.','November 18 minimum viable content policy; verified runtime and database contract.'),
('TAX-EXACTLY-ONCE','warning','An authored tax scenario may be skipped or displaced on this route. Optional tax content does not prevent minimum publication.','November 18 minimum viable content policy; verified runtime and database contract.'),
('PUB-MANDATORY-UNPROVEN','blocker','Individual gameplay or database safety functions changed since this validator was reviewed. Revalidate their structural contract before publication; optional content guarantees are not required.','November 18 minimum viable content policy; verified runtime and database contract.'),
('PUB-SUPPORTED-MODE-FAILURE','information','Retired publication gate: group implementation failures are documented separately and never impose canonical content requirements.','November 18 minimum viable content policy; verified runtime and database contract.'),
('SCN-DORMANT-INCOMPLETE','warning','Explicitly disabled ordinary catalog content, proven outside canonical decisions and recap lookup, lacks text/choices/fact roles. Retain it without a completeness blocker. Structural constraints still apply.','Current task, S, F; E clarification, R diagnostic.'),
('SCN-UNEXPECTED-EXCLUSION','warning','General/unassigned scenarios, missing library metadata or employment gating exclude optional content. Review intended availability; absence does not impose coverage or tax requirements.','S; V, R.'),
('SCN-SCHEDULE-ALTERNATIVES','warning','Multiple library scenarios can compete for a day; each is not guaranteed to appear. Review optional scheduling without imposing filler content requirements.','S; V, R.'),
('SCN-CONDITIONAL-DAY','warning','An ordinary Day-2 slot is excluded, and Day 3 depends on hiring. Slots beyond the calendar or on skipped paths do not imply guaranteed content.','S, E; V, R.'),
('SCN-DORMANCY-UNCERTAIN','warning','Availability of optional content cannot be established confidently. Report the uncertainty without imposing scenario completeness requirements.','S, F; R.'),
('FACT-DISPLAY-INELIGIBLE','information','Eligibility is an ordinary authoring setting, not a publication problem. Empty eligible results are supported.','November 18 minimum viable content policy; verified runtime and database contract.'),
('FACT-PROVENANCE-LIMITED','warning','Reporting period absent, evidence empty/unstructured, or structured source/text linkage cannot be verified mechanically. This is not attestation or a reason to edit read-only statistics.','F, CMS fact contract; V, R.'),
('FACT-VARIETY-UNCERTAIN','warning','Semantic equivalence or co-reachability cannot reliably be inferred from text or evidence. Variety is optional and no automatic equivalence decision or text-to-statistic binding is introduced.','A, F; V, R.'),
('FACT-CAC-REUSE','warning','Multiple events reuse CAC copy. Repetition is allowed; variety is an optional content concern, not a pool-exhaustion guarantee.','A; E, R diagnostic.'),
('EXP-OUTSIDE-CALENDAR','warning','First due day is after 30, so no bill occurrence is produced in the simulation. It is valid under existing expense constraints.','B; V, R.'),
('EXP-RECAP-MISSING','warning','Expense has no context link or event copy. Bills still work financially; do not create links or facts.','B, F; V, R.'),
('SCN-DORMANT-EFFECT','warning','Unsupported support-effect data exists only on proven dormant ordinary content. Report preserved legacy data; do not activate or rewrite it.','S; V, R.'),
('PUB-SOURCE-BEHIND','warning','Draft was copied from an older source than the current canonical default. Show source/current edition and changes, without automatic rebasing. Source age alone is not the previously defined numeric-order prohibition.','P, H; V, R.'),
('PLATFORM-GROUP-DIVERGENCE','information','Group interaction incompatibilities are documented separately from canonical publication validation.','November 18 minimum viable content policy; verified runtime and database contract.'),
('PLATFORM-FACT-HISTORY','information','Fact display history and variety are not required for minimum publication.','November 18 minimum viable content policy; verified runtime and database contract.'),
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
CREATE OR REPLACE FUNCTION public.cms_publication_preflight(p_version uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE
 w cms_private.workspaces; v public.content_versions; f jsonb:='[]'; heads jsonb; active uuid[]; ordinary uuid[];
 p record; s record; x record; ch record; e record; h integer; route record; lib boolean; pool uuid[]; needed integer; available integer;
 owned text[]:=ARRAY['jobs','personas','scenarios','choices','persona_expenses','statistics','scenario_statistics','cac_support_effects','scenario_library_metadata','scenario_fact_copy','scenario_bill_links','scenario_edition_prices'];

 t text; pk text; joins text; violations jsonb; rows_count integer; own_pred text; field record; bad boolean;
BEGIN
 PERFORM cms_private.require_staff();
 SELECT * INTO STRICT w FROM cms_private.workspaces WHERE version_id=p_version;
 SELECT * INTO STRICT v FROM public.content_versions WHERE version_id=p_version;
 heads:=cms_private.publication_heads();
 FOR x IN SELECT * FROM cms_private.publication_runtime_contract WHERE signature NOT LIKE 'group_private.%' AND (to_regprocedure(signature) IS NULL OR md5(pg_get_functiondef(to_regprocedure(signature))) IS DISTINCT FROM definition_hash) LOOP
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
   IF rows_count=0 AND EXISTS(SELECT 1 FROM public.scenarios sc JOIN public.scenario_library_metadata m USING(scenario_id,version_id) WHERE sc.version_id=p_version AND sc.persona_intent=p.persona_id AND m.library_key='D005') THEN
    f:=f||jsonb_build_array(cms_private.publication_finding('TAX-CONFIGURATION',jsonb_build_array(jsonb_build_object('persona_id',p.persona_id,'hired_day',h,'library_key','D005')),'The authored tax scenario is not reachable on this route. Schedule it if you want it to appear.'));
   ELSIF rows_count>0 THEN
    SELECT count(*) INTO rows_count FROM cms_private.publication_route(p_version,p.persona_id,h) r WHERE r.scheduled AND cardinality(r.candidates)>0
    AND NOT EXISTS(SELECT 1 FROM unnest(r.candidates) sid LEFT JOIN public.scenario_library_metadata m ON m.scenario_id=sid AND m.version_id=p_version WHERE m.library_key IS DISTINCT FROM 'D005');
    IF rows_count<>1 OR EXISTS(SELECT 1 FROM cms_private.publication_route(p_version,p.persona_id,h) r JOIN public.scenario_library_metadata m ON m.scenario_id=ANY(r.candidates) AND m.version_id=p_version WHERE m.library_key='D005' AND (NOT r.scheduled OR EXISTS(SELECT 1 FROM unnest(r.candidates) sid JOIN public.scenario_library_metadata other ON other.scenario_id=sid WHERE other.library_key<>'D005'))) THEN
     f:=f||jsonb_build_array(cms_private.publication_finding('TAX-EXACTLY-ONCE',jsonb_build_array(jsonb_build_object('persona_id',p.persona_id,'hired_day',h)),'The authored tax scenario may be skipped or displaced. Review its schedule if this is unintended.')); END IF;
   END IF;
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
   IF NOT cms_private.publication_money(ch.balance_change) OR NOT cms_private.publication_money(ch.upfront_cost) OR ch.upfront_cost<0 THEN
    f:=f||jsonb_build_array(cms_private.publication_finding('REL-CONSTRAINT',jsonb_build_array(to_jsonb(ch)),'Choice financial effects must be finite exact currency values; upfront cost cannot be negative.','database')); END IF;
   IF s.scenario_id=ANY(ordinary) AND (nullif(btrim(ch.choice_text),'') IS NULL OR nullif(btrim(ch.response_text),'') IS NULL ) THEN
    f:=f||jsonb_build_array(cms_private.publication_finding('SCN-PLAYABLE-CONTENT',jsonb_build_array(to_jsonb(ch)))); END IF;
   IF EXISTS(SELECT 1 FROM public.cac_support_effects WHERE choice_id=ch.choice_id) THEN
    f:=f||jsonb_build_array(cms_private.publication_finding(CASE WHEN s.scenario_id=ANY(ordinary) THEN 'SCN-UNSUPPORTED-EFFECT' ELSE 'SCN-DORMANT-EFFECT' END,jsonb_build_array(to_jsonb(ch)))); END IF;
   IF ch.next_scenario_id IS NOT NULL THEN
    f:=f||jsonb_build_array(cms_private.publication_finding('INFO-NEXT-METADATA',jsonb_build_array(jsonb_build_object('choice_id',ch.choice_id,'next_scenario_id',ch.next_scenario_id)))); END IF;

  END LOOP;
 END LOOP;
 FOR e IN SELECT * FROM public.persona_expenses WHERE version_id=p_version ORDER BY expense_id LOOP
  IF NOT cms_private.publication_money(e.amount) OR NOT cms_private.publication_money(e.late_fee_amount) OR e.amount<0 OR e.late_fee_amount<0 OR e.first_due_day<1 OR e.repeat_interval_days<1 THEN
   f:=f||jsonb_build_array(cms_private.publication_finding('EXP-DEFINITION',jsonb_build_array(to_jsonb(e)))); END IF;
  IF e.first_due_day>30 THEN f:=f||jsonb_build_array(cms_private.publication_finding('EXP-OUTSIDE-CALENDAR',jsonb_build_array(to_jsonb(e)))); END IF;
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
 SELECT coalesce(jsonb_agg(item ORDER BY item->>'severity',item->>'code',(item->'affected')::text),'[]') INTO f FROM (SELECT DISTINCT value item FROM jsonb_array_elements(f) WHERE value->>'severity' IN ('blocker','warning')) ordered;
 RETURN jsonb_build_object('version_id',p_version,'version_number',v.version_number,'revision',w.revision,'validator','cms-publication-v2','heads',heads,'findings',f,'can_publish',NOT EXISTS(SELECT 1 FROM jsonb_array_elements(f) finding WHERE finding->>'severity'='blocker'));
END $$;
CREATE OR REPLACE FUNCTION public.cms_publish_draft(p_version uuid,p_revision integer,p_request uuid,p_validator text,p_heads jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE w cms_private.workspaces; v public.content_versions; prior cms_private.publications; report jsonb; result jsonb; instant timestamptz; x record;
 payload jsonb:=jsonb_build_array('publish',p_version,p_revision,p_validator,p_heads);
 owned oid[]:=ARRAY['public.content_versions'::regclass,'public.jobs'::regclass,'public.personas'::regclass,'public.scenarios'::regclass,'public.choices'::regclass,'public.persona_expenses'::regclass,'public.statistics'::regclass,'public.scenario_statistics'::regclass,'public.cac_support_effects'::regclass,'public.scenario_library_metadata'::regclass,'public.scenario_fact_copy'::regclass,'public.scenario_bill_links'::regclass,'public.scenario_edition_prices'::regclass];
BEGIN
 PERFORM cms_private.require_staff();
 PERFORM set_config('lock_timeout','5s',true);
 PERFORM pg_advisory_xact_lock(6310,1115);
 SELECT * INTO STRICT w FROM cms_private.workspaces WHERE version_id=p_version FOR UPDATE;
 SELECT * INTO prior FROM cms_private.publications WHERE version_id=p_version OR (actor=auth.uid() AND request_id=p_request);
 IF FOUND THEN
  IF prior.actor IS DISTINCT FROM auth.uid() OR prior.request_id IS DISTINCT FROM p_request OR prior.payload IS DISTINCT FROM payload
  THEN RAISE EXCEPTION 'Publication request reused with different input or actor'; END IF;
  RETURN prior.result;
 END IF;
 IF p_request IS NULL OR p_revision IS DISTINCT FROM w.revision OR p_validator IS DISTINCT FROM 'cms-publication-v2' OR p_heads IS DISTINCT FROM cms_private.publication_heads() THEN
  RAISE EXCEPTION 'PUB-STALE-REVIEW: saved revision, validator or published edition changed. Run publication review again.' USING ERRCODE='40001'; END IF;
 -- Freeze content and dependency insertion before taking the edition row lock.
 -- This avoids bill-insertion (table then version-share) lock inversion.
 FOR x IN SELECT DISTINCT rel FROM (SELECT unnest(owned) rel UNION SELECT conrelid FROM pg_constraint WHERE contype='f' AND confrelid=ANY(owned)) q ORDER BY rel LOOP
  EXECUTE format('LOCK TABLE %s IN SHARE MODE',x.rel::regclass);
 END LOOP;
 SELECT * INTO STRICT v FROM public.content_versions WHERE version_id=p_version FOR UPDATE;
 IF NOT v.cms_managed OR v.status IS DISTINCT FROM 'draft' OR v.published_at IS NOT NULL THEN RAISE EXCEPTION 'PUB-STATE: unpublished CMS draft required'; END IF;
 report:=public.cms_publication_preflight(p_version);
 IF (report->>'can_publish') IS DISTINCT FROM 'true' THEN
  RAISE EXCEPTION 'Publication blocked. Review the affected content.' USING DETAIL=report::text; END IF;
 INSERT INTO cms_private.publication_permits VALUES(p_version,pg_current_xact_id(),auth.uid(),w.revision,p_request);
 instant:=clock_timestamp();
 UPDATE public.content_versions SET status='published',published_at=instant WHERE version_id=p_version;
 IF cms_private.publication_heads() IS DISTINCT FROM jsonb_build_object('individual',p_version,'group',p_version) THEN
  RAISE EXCEPTION 'PUB-ORDER: selectors would not agree on the new canonical edition'; END IF;
 UPDATE cms_private.workspaces SET revision=revision+1,updated_at=instant WHERE version_id=p_version;
 result:=jsonb_build_object('version_id',p_version,'version_number',v.version_number,'revision',w.revision+1,'published_at',instant,'published_by',auth.uid(),'validator',p_validator);
 INSERT INTO cms_private.publications VALUES(p_version,p_request,auth.uid(),w.revision,p_validator,p_heads,instant,report,payload,result);
 DELETE FROM cms_private.publication_permits WHERE version_id=p_version;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.cms_publication_preflight(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cms_publication_preflight(uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
