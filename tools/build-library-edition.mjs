// Produces a reviewable SQL artifact. Does not connect to or mutate a database.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { buildCatalog } from "../integrations/game_data/catalog.mjs";
const root = new URL("../", import.meta.url);
const library = JSON.parse(
  readFileSync(new URL("docs/data/scenario-library-draft.json", root)),
);
const catalog = process.env.GAME_DATA_SNAPSHOT
  ? JSON.parse(readFileSync(process.env.GAME_DATA_SNAPSHOT, "utf8")).catalog
  : buildCatalog(library);
const id = (key) => {
  const hex = createHash("sha256")
    .update(JSON.stringify(catalog) + key)
    .digest("hex")
    .slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
const cards = catalog.cards;
for (const card of cards) {
  for (const c of card.choices) {
    if (!Number.isFinite(c.amount))
      throw new Error(`Unresolved ${card.key}/${c.key}`);
  }
  if (card.facts.some((f) => !f.semantic_key || !f.text || /[{}]/.test(f.text)))
    throw new Error(`Unresolved fact ${card.key}`);
}
const versionId = id("edition");
const sql = `-- Scenario revisions approved in facts fixes.docx and facts fixes part 2.pdf, November 16, 2026.
-- Starting values and monthly bindings; active runs retain their original edition.
BEGIN;
DO $install$
DECLARE new_version uuid := '${versionId}'; source_version uuid;
 p public.personas%rowtype; c jsonb; ch jsonb; f jsonb; sid uuid; pid uuid;
 eid uuid; new_choice uuid; cat uuid; n integer; amount numeric; fee numeric; due integer;
 payload jsonb := $library$${JSON.stringify(cards)}$library$::jsonb;
 settings jsonb := $settings$${JSON.stringify(catalog)}$settings$::jsonb;
BEGIN
 IF EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=new_version) THEN RAISE EXCEPTION 'Library edition already exists; do not overwrite'; END IF;
 SELECT version_id INTO STRICT source_version FROM public.content_versions
 WHERE status='published' AND published_at IS NOT NULL ORDER BY version_number DESC LIMIT 1;
 INSERT INTO public.content_versions(version_id,version_number,status,created_by,created_at,published_at,change_summary)
 SELECT new_version,max(version_number)+1,'draft',NULL,now(),NULL,
 'Scenario and fact fixes; all households own a car; D016/D017/D023/D031/D037/D038/D041/D052/D057/D060 retired; monthly source bindings.' FROM public.content_versions;
 INSERT INTO public.scenario_edition_prices(version_id,clothing_cost,source_snapshot)
 VALUES(new_version,(settings->>'clothing')::numeric,settings);
 INSERT INTO public.jobs(job_id,version_id,soc_code,title,description,area_code,area_name,geography_level,wage_year,
 median_hourly_wage,hours_per_week,entry_education,related_experience,on_job_training,simulation_requirements,
 wage_source_url,requirements_source_url,reviewed_at,last_synced_at,is_approved,is_active,needs_english_skills,needs_computer_skills)
 SELECT md5(new_version::text||job_id::text)::uuid,new_version,soc_code,title,description,area_code,area_name,geography_level,wage_year,
 median_hourly_wage,hours_per_week,entry_education,related_experience,on_job_training,simulation_requirements,
 wage_source_url,requirements_source_url,reviewed_at,last_synced_at,is_approved,is_active,needs_english_skills,needs_computer_skills
 FROM public.jobs WHERE version_id=source_version;

 IF settings ? 'wages' THEN
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(settings->'wages') AS wage(value)
    WHERE (wage.value->>'hourly')::numeric NOT BETWEEN 5 AND 200)
  THEN RAISE EXCEPTION 'Invalid refreshed wage'; END IF;
  UPDATE public.jobs j SET
   median_hourly_wage=(wage.value->>'hourly')::numeric,
   wage_year=(wage.value->>'year')::integer,
   wage_source_url=wage.value->>'sourceUrl',
   last_synced_at=(wage.value->>'lastSyncedAt')::timestamptz
  FROM jsonb_array_elements(settings->'wages') AS wage(value)
  WHERE j.version_id=new_version AND j.soc_code=wage.value->>'socCode'
   AND (wage.value->>'year')::integer>=j.wage_year;
 END IF;
 INSERT INTO public.personas(persona_id,name,description,general_starting_balance,weekly_income,version_id,starting_job_id,has_english_skills,has_computer_skills)
 SELECT md5(new_version::text||persona_id::text)::uuid,name,description,coalesce((settings->'startingBalances'->>name)::numeric,general_starting_balance),weekly_income,new_version,
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
    VALUES(new_choice,sid,new_version,ch->>'text',
      CASE WHEN c->>'key'='D005' AND ch->>'key' IN ('PAID','CAC')
        THEN coalesce((settings->'refunds'->>p.name)::numeric,(settings->>'taxRefund')::numeric)
          -CASE WHEN ch->>'key'='PAID' THEN (settings->>'taxFee')::numeric ELSE 0 END
        ELSE (ch->>'amount')::numeric END,
      CASE WHEN c->>'key'='D005' AND ch->>'key' IN ('PAID','CAC')
        THEN 'Your tax credit was $'||to_char(coalesce((settings->'refunds'->>p.name)::numeric,(settings->>'taxRefund')::numeric),'FM999999990.00')
          ||'. Preparation fee: $'||to_char((ch->>'upfront_cost')::numeric,'FM999999990.00')||'.'
        ELSE ch->>'response' END,NULL,(ch->>'requires_cac')::boolean,(ch->>'upfront_cost')::numeric);
   END LOOP;
   FOR f IN SELECT * FROM jsonb_array_elements(c->'facts') LOOP
    INSERT INTO public.scenario_fact_copy(scenario_id,version_id,fact_role,semantic_key,display_text,source_url,copy_kind,verified,evidence)
    VALUES(sid,new_version,f->>'role',f->>'semantic_key',f->>'text',f->>'source_url',f->>'copy_kind',true,
     jsonb_build_object('library_key',c->>'key','development_edition',true,'source_hash','${library.sourceHash}'));
   END LOOP;
   -- Independent bills use the same resolved catalog amounts as the source refresh.
   IF c ? 'bill' THEN
    due:=(c->'bill'->>'day')::integer;
    amount:=CASE WHEN c->>'key'='D006'
      THEN coalesce((settings->'rents'->>p.name)::numeric,(settings->'provisionalRents'->>p.name)::numeric)
      ELSE (c->'bill'->>'amount')::numeric END;
    fee:=(c->'bill'->>'fee')::numeric;
    eid:=md5(sid::text||'bill')::uuid;
    INSERT INTO public.persona_expenses(expense_id,persona_id,version_id,name,amount,first_due_day,repeat_interval_days,late_fee_amount)
    VALUES(eid,p.persona_id,new_version,c->>'title',amount,due,NULL,fee);
    INSERT INTO public.scenario_bill_links(expense_id,scenario_id,version_id) VALUES(eid,sid,new_version);
   END IF;
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
`;
const output = new URL(
  "supabase/content/scenario-library-facts-fixes.sql",
  root,
);
writeFileSync(output, sql);
writeFileSync(
  new URL("supabase/functions/_shared/game-data-catalog.json", root),
  JSON.stringify(catalog, null, 2) + "\n",
);
writeFileSync(
  new URL("docs/scenario-source-bindings.md", root),
  "# Monthly scenario price bindings\n\nAll retained nonzero scenario prices and fees use these bindings. Baseline observation month is 2026-10. Approved initial amounts are USD; CPI updates use the original baseline and latest released observation. Retired scenarios are excluded.\n\n| Component | Starting USD | Source | Series or method |\n| --- | --- | --- | --- |\n" +
    Object.entries(catalog.bindings)
      .map(
        ([key, b]) =>
          `| ${key} | ${b.amount.toFixed(2)} | ${b.source} | ${b.series ?? { rentcast: "Six-ZIP bedroom rents weighted by listing count", eia: "Georgia residential monthly revenue / customers", school: "Published elementary lunch rate times 20", "marta-two": "Two published single fares" }[b.source] ?? "Published product"} |`,
      )
      .join("\n") +
    "\n\nFixed simulation tax credits are USD 989 for Alex, Sofia and Patricia, and USD 1989 for Jordan and Maya. See [setup and assumptions](supabase-game-data-setup.md).\n",
);
console.log(
  `Prepared ${cards.length} authored cards for edition ${versionId}; no database changed.`,
);
