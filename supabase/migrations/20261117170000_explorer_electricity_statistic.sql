-- Explore Data statistic definition: Georgia residential electricity price.
--
-- Approved variable: EIA electricity retail sales, average retail price, state
-- GA, sector RES, monthly (docs/api.md section 7). This defines the statistic
-- only. It seeds NO value: the first observation is staged by the refresh and
-- approved once by staff; later refreshes publish automatically (see
-- record_explorer_observation).
--
-- Depends on 20261117150000_explorer_statistics.sql.

insert into public.explorer_statistics (
  statistic_key, category_key, source_id, title, description, context_note,
  unit, geography, visualization_type, visualization_config, source_reference,
  is_derived, display_order
)
values (
  'ga_residential_electricity_price',
  'housing',
  'eia_electricity',
  'Residential electricity price',
  'The average price Georgia households paid for electricity, in cents per kilowatt-hour.',
  'This is a statewide average price per unit of electricity for residential customers. It is not a household bill: what a household pays depends on how much electricity it uses, its utility, and fees. EIA publishes each month with a delay of a few months.',
  'cents_per_kwh',
  'Georgia (statewide)',
  'figure',
  '{"decimals": 2}'::jsonb,
  '{"provider": "eia", "route": "electricity/retail-sales", "field": "price", "facets": {"stateid": "GA", "sectorid": "RES"}, "frequency": "monthly"}'::jsonb,
  false,
  1
)
on conflict (statistic_key) do nothing;
