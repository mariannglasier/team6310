-- First Explore Data statistic definition: Atlanta food and beverage prices.
--
-- Approved variable: FRED series CUURA319SAF (the team's research notes and
-- docs/api.md). This defines the statistic only. It seeds NO value: the first
-- observation is staged by the refresh and approved once by staff; later
-- refreshes publish automatically (see record_explorer_observation).
--
-- Depends on 20261117150000_explorer_statistics.sql.

insert into public.explorer_statistics (
  statistic_key, category_key, source_id, title, description, context_note,
  unit, geography, visualization_type, visualization_config, source_reference,
  is_derived, derivation_note, display_order
)
values (
  'atl_food_beverage_cpi_change',
  'food',
  'fred',
  'Food and beverage prices, year over year',
  'How much more (or less) food and beverages cost in the Atlanta area than they did a year earlier, measured by the Consumer Price Index.',
  'This tracks the price level of a basket of goods across the metro area. It is not the price of any one grocery item and not the amount a household spends on food. The series is collected only in even-numbered months, so the figure is for the latest month that has both a current and a prior-year value.',
  'percent_change',
  'Atlanta-Sandy Springs-Roswell, GA (metro area)',
  'figure',
  '{"signed": true, "decimals": 1}'::jsonb,
  '{"provider": "fred", "series_id": "CUURA319SAF", "transform": "yoy_percent_change", "base_period": "1982-1984=100"}'::jsonb,
  true,
  'Percent change = (index in the latest month with data / index in the same month one year earlier - 1) x 100, using FRED series CUURA319SAF (CPI-U food and beverages, not seasonally adjusted). Missing months are never filled in.',
  1
)
on conflict (statistic_key) do nothing;
