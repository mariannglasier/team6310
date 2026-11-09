// Produces a reviewable SQL artifact. Does not connect to or mutate a database.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
const root = new URL('../', import.meta.url)
const library = JSON.parse(readFileSync(new URL('docs/data/scenario-library-draft.json', root)))
const id = (key) => {
  const hex = createHash('sha256').update(`development-library-20261109:${key}`).digest('hex').slice(0, 32)
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
}
const sourceRoot = 'https://github.com/mariannglasier/team6310/blob/content/scenario-cac-facts/docs/'
const overrides = {
  'D025-AGENCY': -12996, 'D025-SHORT': -6498,
  'D027-BASIC': -9500, 'D034-FULL': -27999,
  'D037-TRANSIT': -500, 'D044-TRANSIT': -500,
  'D038-FULL': -400, 'D038-SMALL': -250,
  'D057-PASS': -2375, 'D057-FARES': -1000,
}
const cards = library.cards.map((card) => ({
  key: card.key, title: card.title, category: card.category, engine: card.engine,
  intent: card.personaIntent, description: card.situation,
  choices: card.engine !== 'ordinary' ? [] : card.choices.map((c) => ({
    key: c.key, text: c.text, response: c.responseText,
    requires_cac: c.requiresCac,
    amount: (overrides[c.key] ?? c.draftCents ?? (c.requiresCac ? 0 : card.key === 'D005' ? c.key === 'PAID' ? 90100 : 0 : null)) / 100,
    upfront_cost: card.key === 'D005' && c.key === 'PAID' ? 99 : 0,
    ...(card.key === 'D005' && c.key === 'CAC' ? { amount: 1000 } : {}),
  })),
  facts: [
    { role: 'general', text: card.generalFact.hasUnresolvedTokens
        ? card.generalFact.text.split(/(?<=[.!?])\s+/)[0] : card.generalFact.text,
      semantic_key: card.generalFact.hasUnresolvedTokens ? `context:${card.key}` : card.generalFact.semanticKey,
      copy_kind: card.generalFact.hasUnresolvedTokens ? 'context' : 'fact',
      source_url: card.generalFact.hasUnresolvedTokens ? sourceRoot + 'scenario-data-sourcing.md' : card.generalFact.sourceUrls[0] ?? sourceRoot + 'scenario-data-sourcing.md',
    },
    ...(card.cacFact.text ? [{ role: 'cac', text: card.cacFact.text,
      semantic_key: card.cacFact.semanticKey || `cac:${card.key}`, copy_kind: 'fact',
      source_url: sourceRoot + 'data/cac-service-facts-2025.json',
    }] : []),
  ],
}))
// Reserve the child count for D048; D014 uses a different food observation.
const mealValue = JSON.parse(readFileSync(new URL('docs/data/cac-service-facts-2025.json', root))).facts.find(
 (f) => f.service_key === 'meals_for_kids' && f.fact_key === 'in_kind_value_for_meals_for_kids',
)
if (mealValue) {
 const schoolMeal = cards.find((c) => c.key === 'D014').facts.find((f) => f.role === 'cac')
 schoolMeal.text = 'In ' + mealValue.reporting_year + ', CAC reported ' + String.fromCharCode(36) + Number(mealValue.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' in in-kind value through Meals for Kids.'
 schoolMeal.semantic_key = 'cac:meals_for_kids:in_kind_value'
}
for (const card of cards) {
  for (const c of card.choices) {
    if (!Number.isFinite(c.amount)) throw new Error(`Unresolved ${card.key}/${c.key}`)
  }
  if (card.facts.some((f) => !f.text || /[{}]/.test(f.text))) throw new Error(`Unresolved fact ${card.key}`)
}
const versionId = id('edition')
const sql = `-- Development edition explicitly authorized November 9, 2026.
-- Draft prices; optional CAC facts; no old edition or run is rewritten.
BEGIN;
DO $install$
DECLARE new_version uuid := '${versionId}'; source_version uuid;
 p public.personas%rowtype; c jsonb; ch jsonb; f jsonb; sid uuid; pid uuid;
 eid uuid; new_choice uuid; cat uuid; n integer; amount numeric; fee numeric; due integer;
 payload jsonb := $library$${JSON.stringify(cards)}$library$::jsonb;
BEGIN
 IF EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=new_version) THEN RAISE EXCEPTION 'Library edition already exists; do not overwrite'; END IF;
 SELECT version_id INTO STRICT source_version FROM public.content_versions
 WHERE status='published' AND published_at IS NOT NULL ORDER BY version_number DESC LIMIT 1;
 INSERT INTO public.content_versions(version_id,version_number,status,created_by,created_at,published_at,change_summary)
 SELECT new_version,max(version_number)+1,'draft',NULL,now(),NULL,
 'Development scenario library: draft prices authorized November 9; CAC facts optional; unresolved statistics replaced with labeled authored context. Car scenarios remain disabled pending ownership mapping.' FROM public.content_versions;
 INSERT INTO public.jobs(job_id,version_id,soc_code,title,description,area_code,area_name,geography_level,wage_year,
 median_hourly_wage,hours_per_week,entry_education,related_experience,on_job_training,simulation_requirements,
 wage_source_url,requirements_source_url,reviewed_at,last_synced_at,is_approved,is_active,needs_english_skills,needs_computer_skills)
 SELECT md5(new_version::text||job_id::text)::uuid,new_version,soc_code,title,description,area_code,area_name,geography_level,wage_year,
 median_hourly_wage,hours_per_week,entry_education,related_experience,on_job_training,simulation_requirements,
 wage_source_url,requirements_source_url,reviewed_at,last_synced_at,is_approved,is_active,needs_english_skills,needs_computer_skills
 FROM public.jobs WHERE version_id=source_version;
 INSERT INTO public.personas(persona_id,name,description,general_starting_balance,weekly_income,version_id,starting_job_id,has_english_skills,has_computer_skills)
 SELECT md5(new_version::text||persona_id::text)::uuid,name,description,general_starting_balance,weekly_income,new_version,
 CASE WHEN starting_job_id IS NULL THEN NULL ELSE md5(new_version::text||starting_job_id::text)::uuid END,has_english_skills,has_computer_skills
 FROM public.personas WHERE version_id=source_version;
 FOR p IN SELECT * FROM public.personas WHERE version_id=new_version LOOP
  FOR c IN SELECT * FROM jsonb_array_elements(payload) LOOP
   IF c->>'intent' NOT IN ('ALL','EMPLOYED') AND upper(p.name)<>c->>'intent' THEN CONTINUE; END IF;
   sid:=md5(new_version::text||p.persona_id::text||(c->>'key'))::uuid;
   SELECT category_id INTO STRICT cat FROM public.categories WHERE name=c->>'category';
   INSERT INTO public.scenarios(scenario_id,version_id,title,description,category_id,persona_intent,schedule_type,default_day)
   VALUES(sid,new_version,c->>'title',c->>'description',cat,p.persona_id,
     CASE WHEN c->>'key'='D005' THEN 'scheduled' ELSE 'non_scheduled' END,
     CASE WHEN c->>'key'='D005' THEN 18 ELSE NULL END);
   INSERT INTO public.scenario_library_metadata(scenario_id,version_id,library_key,engine,requires_employment)
   VALUES(sid,new_version,c->>'key',c->>'engine',c->>'intent'='EMPLOYED' OR c->>'key'='D025');
   FOR ch IN SELECT * FROM jsonb_array_elements(c->'choices') LOOP
    new_choice:=md5(sid::text||(ch->>'key'))::uuid;
    INSERT INTO public.choices(choice_id,scenario_id,version_id,choice_text,balance_change,response_text,next_scenario_id,requires_cac,upfront_cost)
    VALUES(new_choice,sid,new_version,ch->>'text',(ch->>'amount')::numeric,ch->>'response',NULL,(ch->>'requires_cac')::boolean,(ch->>'upfront_cost')::numeric);
   END LOOP;
   FOR f IN SELECT * FROM jsonb_array_elements(c->'facts') LOOP
    INSERT INTO public.scenario_fact_copy(scenario_id,version_id,fact_role,semantic_key,display_text,source_url,copy_kind,verified,evidence)
    VALUES(sid,new_version,f->>'role',f->>'semantic_key',f->>'text',f->>'source_url',f->>'copy_kind',true,
     jsonb_build_object('library_key',c->>'key','development_edition',true,'source_hash','${library.sourceHash}'));
   END LOOP;
   -- Essential monthly bills, with childcare/school bills only for Jordan.
   due:=CASE c->>'key' WHEN 'D006' THEN 6 WHEN 'D007' THEN 12 WHEN 'D008' THEN 27
     WHEN 'D009' THEN 16 WHEN 'D010' THEN 23 WHEN 'D013' THEN 8 WHEN 'D014' THEN 14 WHEN 'D018' THEN 29 ELSE NULL END;
   IF due IS NOT NULL THEN
    amount:=CASE c->>'key' WHEN 'D006' THEN CASE p.name WHEN 'Alex' THEN 693.50 WHEN 'Sofia' THEN 868.50 WHEN 'Jordan' THEN 1737 ELSE 1387 END
      WHEN 'D007' THEN 145 WHEN 'D008' THEN 68 WHEN 'D009' THEN 25 WHEN 'D010' THEN 65 WHEN 'D013' THEN 260 WHEN 'D014' THEN 31 WHEN 'D018' THEN 92 END;
    fee:=CASE c->>'key' WHEN 'D006' THEN 35 WHEN 'D007' THEN 10 WHEN 'D008' THEN 8 WHEN 'D009' THEN 5 WHEN 'D010' THEN 7 WHEN 'D013' THEN 25 WHEN 'D014' THEN 0 WHEN 'D018' THEN 9 END;
    eid:=md5(sid::text||'bill')::uuid;
    INSERT INTO public.persona_expenses(expense_id,persona_id,version_id,name,amount,first_due_day,repeat_interval_days,late_fee_amount)
    VALUES(eid,p.persona_id,new_version,c->>'title',amount,due,NULL,fee);
    INSERT INTO public.scenario_bill_links(expense_id,scenario_id,version_id) VALUES(eid,sid,new_version);
   END IF;
  END LOOP;
 END LOOP;
 -- Keep car-dependent cards in the catalog, disabled until ownership is configured.
 FOR c IN SELECT * FROM jsonb_array_elements(payload) WHERE value->>'intent'='CAR' LOOP
  sid:=md5(new_version::text||(c->>'key'))::uuid;
  SELECT category_id INTO STRICT cat FROM public.categories WHERE name=c->>'category';
  INSERT INTO public.scenarios(scenario_id,version_id,title,description,category_id,persona_intent,schedule_type,default_day)
  VALUES(sid,new_version,c->>'title',c->>'description',cat,NULL,'non_scheduled',NULL);
  INSERT INTO public.scenario_library_metadata(scenario_id,version_id,library_key,engine,enabled)
  VALUES(sid,new_version,c->>'key',c->>'engine',false);
  FOR ch IN SELECT * FROM jsonb_array_elements(c->'choices') LOOP
   INSERT INTO public.choices(choice_id,scenario_id,version_id,choice_text,balance_change,response_text,next_scenario_id,requires_cac,upfront_cost)
   VALUES(md5(sid::text||(ch->>'key'))::uuid,sid,new_version,ch->>'text',(ch->>'amount')::numeric,ch->>'response',NULL,(ch->>'requires_cac')::boolean,(ch->>'upfront_cost')::numeric);
  END LOOP;
  FOR f IN SELECT * FROM jsonb_array_elements(c->'facts') LOOP
   INSERT INTO public.scenario_fact_copy(scenario_id,version_id,fact_role,semantic_key,display_text,source_url,copy_kind,verified,evidence)
   VALUES(sid,new_version,f->>'role',f->>'semantic_key',f->>'text',f->>'source_url',f->>'copy_kind',true,jsonb_build_object('library_key',c->>'key','development_edition',true));
  END LOOP;
 END LOOP;
 IF (SELECT count(*) FROM public.personas WHERE version_id=new_version)<>4 OR
    (SELECT count(*) FROM public.jobs WHERE version_id=new_version AND is_active AND is_approved AND NOT needs_english_skills AND NOT needs_computer_skills)<2
 THEN RAISE EXCEPTION 'Incomplete playable edition'; END IF;
 IF EXISTS(SELECT 1 FROM public.personas pe WHERE pe.version_id=new_version AND NOT EXISTS(
  SELECT 1 FROM public.scenarios s JOIN public.scenario_library_metadata m USING(scenario_id,version_id)
  WHERE s.persona_intent=pe.persona_id AND m.library_key='D005' AND s.default_day=18)) THEN RAISE EXCEPTION 'Missing mandatory tax day'; END IF;
 UPDATE public.content_versions SET status='published',published_at=now() WHERE version_id=new_version;
END $install$;
COMMIT;
`
const output = new URL('supabase/content/scenario-library-development.sql', root)
writeFileSync(output, sql)
console.log(`Prepared ${cards.length} authored cards for edition ${versionId}; no database changed.`)
