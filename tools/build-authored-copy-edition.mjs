import fs from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const catalog = JSON.parse(
  fs.readFileSync(root + "supabase/functions/_shared/game-data-catalog.json"),
);
const facts = catalog.cards.map((c) => ({
  key: c.key,
  description: c.description,
  title: c.title,
  facts: c.facts,
}));
const repairs = {
  "â€™": "’",
  "â€˜": "‘",
  "â€œ": "“",
  "â€\u009d": "”",
  "â€“": "–",
  "â€”": "—",
  "â€¦": "…",
  "Â·": "·",
  "Â ": " ",
};
const repairSql = Object.entries(repairs)
  .map(
    ([bad, good]) =>
      ` payload:=replace(payload::text,'${bad}','${good}')::jsonb;`,
  )
  .join("\n");
const sql = `-- Publish corrected authored copy with existing verified prices and dates. No provider calls.
-- Read this UTF-8 file explicitly as UTF-8; do not use legacy Windows ANSI decoding.
BEGIN;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $copy$
DECLARE payload jsonb; cards jsonb:='[]'; c jsonb; fresh jsonb; f jsonb; old_fact jsonb;
 facts jsonb; templates jsonb:=$templates$${JSON.stringify(facts)}$templates$;
 observations jsonb; series jsonb; latest jsonb; previous jsonb; pct numeric; rendered text; vid uuid;
BEGIN
 SELECT source_snapshot INTO STRICT payload FROM public.scenario_edition_prices
 WHERE version_id=(SELECT version_id FROM public.content_versions WHERE status='published' ORDER BY version_number DESC LIMIT 1);
${repairSql}
 SELECT result->'observations' INTO observations FROM public.game_data_refresh_runs ORDER BY period DESC LIMIT 1;
 FOR c IN SELECT * FROM jsonb_array_elements(payload->'cards') LOOP
  SELECT t INTO STRICT fresh FROM jsonb_array_elements(templates) t WHERE t->>'key'=c->>'key';
  facts:='[]';
  FOR f IN SELECT * FROM jsonb_array_elements(fresh->'facts') LOOP
   SELECT item INTO old_fact FROM jsonb_array_elements(c->'facts') item WHERE item->>'role'=f->>'role';
   IF (f->>'template') LIKE '%{%' THEN
    IF f->>'semantic_key' LIKE 'cpi:%' THEN
     series:=observations->('CUUR0000'||split_part(f->>'semantic_key',':',2));
     SELECT observed.value,earlier.value INTO latest,previous
     FROM jsonb_array_elements(coalesce(series,'[]')) observed
     JOIN jsonb_array_elements(coalesce(series,'[]')) earlier
      ON earlier.value->>'period'=((left(observed.value->>'period',4)::integer-1)::text||substring(observed.value->>'period' from 5))
     ORDER BY observed.value->>'period' DESC LIMIT 1;
     IF latest IS NOT NULL AND previous IS NOT NULL THEN
      pct:=100*((latest->>'value')::numeric/(previous->>'value')::numeric-1);
      rendered:=replace(replace(replace(replace(f->>'template','{base observation period}',previous->>'period'),'{latest observation period}',latest->>'period'),'{pct}',to_char(abs(round(pct,1)),'FM999990.0')),'{change}',CASE WHEN pct<0 THEN 'decreased' ELSE 'increased' END);
      IF pct=0 THEN rendered:=replace(rendered,'increased by 0.0%.','did not change.'); END IF;
      f:=f||jsonb_build_object('text',rendered,'copy_kind','fact');
     ELSE
      f:=f||jsonb_build_object('text',coalesce(old_fact->>'text',f->>'text'),'copy_kind',coalesce(old_fact->>'copy_kind',f->>'copy_kind'));
     END IF;
    ELSIF old_fact->>'semantic_key'=f->>'semantic_key' THEN
     f:=old_fact||f||jsonb_build_object('text',old_fact->>'text','copy_kind',old_fact->>'copy_kind','source_url',old_fact->>'source_url');
    END IF;
   END IF;
   facts:=facts||jsonb_build_array(f);
  END LOOP;
  cards:=cards||jsonb_build_array(c||jsonb_build_object('facts',facts,'description',fresh->'description','title',fresh->'title'));
 END LOOP;
 payload:=payload||jsonb_build_object('cards',cards,'sourceHash','${catalog.sourceHash}');
 vid:=public.publish_scenario_source_edition(payload);
 UPDATE public.content_versions SET change_summary='Proofread authored facts, correct encoding and regular-mode descriptions, and resolve latest complete annual fact comparisons; preserve prices and verification dates.' WHERE version_id=vid;
END $copy$;
COMMIT;
`;
fs.writeFileSync(root + "supabase/content/restore-authored-facts.sql", sql);
