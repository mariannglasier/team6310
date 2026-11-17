-- Local-only compatibility for the current hosted table absent from the old local fixture.
CREATE TABLE IF NOT EXISTS public.scenario_edition_prices (
 version_id uuid PRIMARY KEY REFERENCES public.content_versions(version_id),
 clothing_cost numeric NOT NULL CHECK(clothing_cost>0 AND clothing_cost<1000000 AND clothing_cost=round(clothing_cost,2)),
 source_snapshot jsonb NOT NULL
);
ALTER TABLE public.scenario_edition_prices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.scenario_edition_prices FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.scenario_edition_prices TO service_role;
