-- Explore Data statistic definitions: the remaining API-backed statistics.
--
-- Series and variables were verified against the live FRED and Census APIs on
-- November 17, 2026 (docs/explorer-statistics-catalog.md):
--   FRED ATLA013URN        Atlanta-Sandy Springs-Roswell unemployment rate (monthly)
--   FRED CUUR0000SAF11     CPI food at home, U.S. city average (monthly index)
--   FRED PSAVERT           Personal saving rate (monthly)
--   FRED DRCLACBS          Delinquency rate on consumer loans, commercial banks (quarterly)
--   ACS  S1701_C03_002E    Percent of children under 18 below poverty
--   ACS  DP04_0141PE+0142PE Renters paying 30.0-34.9% plus 35.0%+ of income on rent
-- These define statistics only. They seed NO value: the first observation of each
-- is staged by the refresh and approved once by staff; later refreshes publish
-- automatically (see record_explorer_observation).
--
-- Depends on 20261117150000_explorer_statistics.sql.

insert into public.explorer_statistics (
  statistic_key, category_key, source_id, title, description, context_note,
  unit, geography, visualization_type, visualization_config, source_reference,
  is_derived, derivation_note, display_order
)
values
(
  'atl_unemployment_rate',
  'employment',
  'fred',
  'Unemployment rate, Atlanta area',
  'The share of people in the Atlanta area''s labor force who are out of work and looking for a job.',
  'This counts people actively looking for work, not everyone without a job. It is not adjusted for the season, so a month can differ from the one before because of the time of year. It is published about a month after the period it covers.',
  'percent',
  'Atlanta-Sandy Springs-Roswell, GA (metro area)',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "fred", "series_id": "ATLA013URN", "transform": "level"}'::jsonb,
  false, null, 1
),
(
  'us_food_at_home_price_change',
  'food',
  'fred',
  'Grocery prices, year over year',
  'How much more (or less) groceries cost across the United States than they did a year earlier, measured by the Consumer Price Index for food at home.',
  'Food at home means groceries bought at stores; it leaves out restaurant meals. This is a national average of price changes, not what any one household pays. The index is missing for some months, so the figure uses the latest month that has both a current and a prior-year value.',
  'percent_change',
  'United States (city average)',
  'figure',
  '{"signed": true, "decimals": 1}'::jsonb,
  '{"provider": "fred", "series_id": "CUUR0000SAF11", "transform": "yoy_percent_change", "base_period": "1982-1984=100"}'::jsonb,
  true,
  'Percent change = (index in the latest month with data / index in the same month one year earlier - 1) x 100, using FRED series CUUR0000SAF11 (CPI-U food at home, not seasonally adjusted). Missing months are never filled in.',
  3
),
(
  'us_personal_saving_rate',
  'finances',
  'fred',
  'Personal saving rate',
  'The share of their after-tax income that Americans set aside instead of spending.',
  'This is a national average from the Bureau of Economic Analysis, adjusted for the season and stated as an annual rate. It says nothing about any one household.',
  'percent',
  'United States',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "fred", "series_id": "PSAVERT", "transform": "level"}'::jsonb,
  false, null, 1
),
(
  'us_consumer_loan_delinquency_rate',
  'finances',
  'fred',
  'Consumer loans that are behind on payments',
  'The share of consumer loans at U.S. commercial banks where borrowers have fallen behind on payments.',
  'A loan counts as delinquent when payments are 30 or more days past due or the bank has stopped accruing interest on it. This covers loans at commercial banks, is adjusted for the season, and is published each quarter by the Federal Reserve.',
  'percent',
  'United States (commercial banks)',
  'meter',
  '{"decimals": 2}'::jsonb,
  '{"provider": "fred", "series_id": "DRCLACBS", "transform": "level", "frequency": "quarterly"}'::jsonb,
  false, null, 2
),
(
  'sandy_springs_child_poverty_rate',
  'youth',
  'census_acs',
  'Children living below the poverty line, Sandy Springs',
  'The share of Sandy Springs children under 18 who live in households below the federal poverty line.',
  'This is an estimate from the American Community Survey, which samples households over five years, so it carries a margin of error. It describes the city as a whole, not any one household.',
  'percent',
  'Sandy Springs, GA (city)',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "census", "dataset": "acs/acs5/subject", "variable": "S1701_C03_002E", "moe_variable": "S1701_C03_002M", "geography": {"for": "place:68516", "in": "state:13"}, "expected_name": "Sandy Springs city, Georgia", "expect": "percent"}'::jsonb,
  false, null, 3
),
(
  'sandy_springs_renter_cost_burden',
  'housing',
  'census_acs',
  'Renters paying 30% or more of income on rent',
  'The share of Sandy Springs households that pay rent and spend at least 30% of their income on it.',
  'Households that spend 30% or more of their income on housing are called cost-burdened. This is an estimate from the American Community Survey, which samples households over five years, so it carries a margin of error.',
  'percent',
  'Sandy Springs, GA (city)',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "census", "dataset": "acs/acs5/profile", "variable": "DP04_0141PE", "add_variables": ["DP04_0142PE"], "moe_variable": "DP04_0141PM", "add_moe_variables": ["DP04_0142PM"], "geography": {"for": "place:68516", "in": "state:13"}, "expected_name": "Sandy Springs city, Georgia", "expect": "percent"}'::jsonb,
  true,
  'Sum of two American Community Survey data profile rows, as shares of occupied units paying rent: gross rent 30.0 to 34.9 percent of household income (DP04_0141PE) plus 35.0 percent or more (DP04_0142PE). The margin of error combines the two margins as the square root of the sum of their squares.',
  3
)
on conflict (statistic_key) do nothing;
