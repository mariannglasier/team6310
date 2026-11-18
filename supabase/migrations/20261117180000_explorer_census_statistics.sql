-- Explore Data statistic definitions backed by the Census Bureau API.
--
-- Approved variables (docs/explorer-statistics-catalog.md, verified against the
-- live Census API on November 17, 2026):
--   S1701_C03_001E   ACS subject table: percent below poverty level
--   S1601_C02_003E   ACS subject table: percent speaking a language other than English
--   SAEPOVRT0_17_PT  SAIPE: poverty rate, ages 0-17, with 90% bounds
-- These define statistics only. They seed NO value: the first observation of each
-- is staged by the refresh and approved once by staff; later refreshes publish
-- automatically (see record_explorer_observation).
--
-- SAIPE reports counties, not Sandy Springs or Dunwoody, so those statistics are
-- labeled with the county.
--
-- Depends on 20261117150000_explorer_statistics.sql.

insert into public.explorer_statistics (
  statistic_key, category_key, source_id, title, description, context_note,
  unit, geography, visualization_type, visualization_config, source_reference,
  is_derived, display_order
)
values
(
  'sandy_springs_poverty_rate',
  'employment',
  'census_acs',
  'Residents living below the poverty line',
  'The share of Sandy Springs residents whose household income is below the federal poverty line.',
  'This is an estimate from the American Community Survey, which samples households over five years, so it carries a margin of error. It describes the city as a whole, not any one household.',
  'percent',
  'Sandy Springs, GA (city)',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "census", "dataset": "acs/acs5/subject", "variable": "S1701_C03_001E", "moe_variable": "S1701_C03_001M", "geography": {"for": "place:68516", "in": "state:13"}, "expected_name": "Sandy Springs city, Georgia", "expect": "percent"}'::jsonb,
  false,
  2
),
(
  'sandy_springs_language_other_than_english',
  'employment',
  'census_acs',
  'Residents who speak a language other than English at home',
  'The share of Sandy Springs residents age 5 and older who speak a language other than English at home.',
  'This is an estimate from the American Community Survey, which samples households over five years, so it carries a margin of error. It does not say how well anyone speaks English.',
  'percent',
  'Sandy Springs, GA (city)',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "census", "dataset": "acs/acs5/subject", "variable": "S1601_C02_003E", "moe_variable": "S1601_C02_003M", "geography": {"for": "place:68516", "in": "state:13"}, "expected_name": "Sandy Springs city, Georgia", "expect": "percent"}'::jsonb,
  false,
  3
),
(
  'fulton_child_poverty_rate',
  'youth',
  'census_saipe',
  'Children living in poverty, Fulton County',
  'The share of children under 18 in Fulton County who live in families below the poverty line.',
  'Census publishes this estimate for counties, not for Sandy Springs or Dunwoody, so it covers all of Fulton County. It is a modeled estimate and is shown with its 90% interval.',
  'percent',
  'Fulton County, GA',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "census", "dataset": "timeseries/poverty/saipe", "variable": "SAEPOVRT0_17_PT", "lower_variable": "SAEPOVRT0_17_LB90", "upper_variable": "SAEPOVRT0_17_UB90", "geography": {"for": "county:121", "in": "state:13"}, "expected_name": "Fulton County", "expect": "percent"}'::jsonb,
  false,
  1
),
(
  'dekalb_child_poverty_rate',
  'youth',
  'census_saipe',
  'Children living in poverty, DeKalb County',
  'The share of children under 18 in DeKalb County who live in families below the poverty line.',
  'Census publishes this estimate for counties, not for Sandy Springs or Dunwoody, so it covers all of DeKalb County. It is a modeled estimate and is shown with its 90% interval.',
  'percent',
  'DeKalb County, GA',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "census", "dataset": "timeseries/poverty/saipe", "variable": "SAEPOVRT0_17_PT", "lower_variable": "SAEPOVRT0_17_LB90", "upper_variable": "SAEPOVRT0_17_UB90", "geography": {"for": "county:089", "in": "state:13"}, "expected_name": "DeKalb County", "expect": "percent"}'::jsonb,
  false,
  2
)
on conflict (statistic_key) do nothing;
