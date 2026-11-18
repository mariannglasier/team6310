-- Explore Data statistic definitions: local need, education and work, and U.S.
-- comparisons.
--
-- Series and variables were verified against the live FRED and Census APIs on
-- November 18, 2026 (docs/explorer-statistics-catalog.md, "Verified candidates"):
--   ACS 5-year, Sandy Springs (place 68516, state 13)
--     S2201_C04_001E  Percent of households receiving food stamps/SNAP
--     S1501_C02_014E  Percent of adults 25+ with a high school diploma or higher
--     S2801_C02_011E  Percent of households with no computer
--     S1601_C06_003E  Percent of non-English speakers who speak English less than "very well"
--   ACS 1-year, United States (for=us:1)
--     S1701_C03_001E  Percent below the poverty line
--     S1701_C03_002E  Percent of children under 18 below the poverty line
--     DP04_0141PE + DP04_0142PE  Renters paying 30% or more of income on rent
--   FRED (U.S.)
--     LNS14027659 / LNS14027660 / LNS14027662  Unemployment rate by education (monthly)
--     LEU0252916700Q / LEU0252917300Q / LEU0252918500Q  Median weekly earnings by education (quarterly)
--     CUUR0000SEHF01  CPI electricity, U.S. city average (monthly index)
-- These define statistics only. They seed NO value: the monthly refresh fetches
-- each one and publishes it automatically (20261118120000_explorer_automatic_publication.sql).
--
-- Depends on 20261117150000_explorer_statistics.sql.

insert into public.explorer_sources
  (source_id, name, title, url, access_method, update_cadence)
values
  ('census_acs1', 'U.S. Census Bureau', 'American Community Survey 1-Year Estimates',
   'https://www.census.gov/data/developers/data-sets/acs-1year.html', 'api', 'Annual release')
on conflict (source_id) do nothing;

insert into public.explorer_statistics (
  statistic_key, category_key, source_id, title, description, context_note,
  unit, geography, visualization_type, visualization_config, source_reference,
  is_derived, derivation_note, display_order
)
values
-- ---------------------------------------------------------- Sandy Springs (ACS 5-year)
(
  'sandy_springs_snap_households',
  'food',
  'census_acs',
  'Households receiving SNAP, Sandy Springs',
  'The share of Sandy Springs households that receive food stamps through the Supplemental Nutrition Assistance Program (SNAP).',
  'This is an estimate from the American Community Survey, which samples households over five years, so it carries a margin of error. It counts households that receive SNAP, not everyone who is eligible or everyone who struggles to afford food.',
  'percent',
  'Sandy Springs, GA (city)',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "census", "dataset": "acs/acs5/subject", "variable": "S2201_C04_001E", "moe_variable": "S2201_C04_001M", "geography": {"for": "place:68516", "in": "state:13"}, "expected_name": "Sandy Springs city, Georgia", "expect": "percent"}'::jsonb,
  false, null, 4
),
(
  'sandy_springs_high_school_graduates',
  'employment',
  'census_acs',
  'Adults with a high school diploma or higher, Sandy Springs',
  'The share of Sandy Springs residents age 25 and over who have graduated from high school (or earned an equivalency) or gone further.',
  'This is an estimate from the American Community Survey, which samples households over five years, so it carries a margin of error. The remaining adults have not finished high school.',
  'percent',
  'Sandy Springs, GA (city)',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "census", "dataset": "acs/acs5/subject", "variable": "S1501_C02_014E", "moe_variable": "S1501_C02_014M", "geography": {"for": "place:68516", "in": "state:13"}, "expected_name": "Sandy Springs city, Georgia", "expect": "percent"}'::jsonb,
  false, null, 4
),
(
  'sandy_springs_no_computer',
  'employment',
  'census_acs',
  'Households with no computer, Sandy Springs',
  'The share of Sandy Springs households that have no computer of any kind: no desktop, laptop, tablet, or smartphone.',
  'This is an estimate from the American Community Survey, which samples households over five years, so it carries a margin of error. It counts households, not individual workers or job seekers.',
  'percent',
  'Sandy Springs, GA (city)',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "census", "dataset": "acs/acs5/subject", "variable": "S2801_C02_011E", "moe_variable": "S2801_C02_011M", "geography": {"for": "place:68516", "in": "state:13"}, "expected_name": "Sandy Springs city, Georgia", "expect": "percent"}'::jsonb,
  false, null, 5
),
(
  'sandy_springs_limited_english',
  'employment',
  'census_acs',
  'Non-English speakers who speak English less than "very well", Sandy Springs',
  'Among Sandy Springs residents age 5 and over who speak a language other than English at home, the share who say they speak English less than "very well."',
  'This is a share of people who speak another language at home, not of all residents. It is self-reported in the American Community Survey, which samples households over five years, so it carries a margin of error.',
  'percent',
  'Sandy Springs, GA (city)',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "census", "dataset": "acs/acs5/subject", "variable": "S1601_C06_003E", "moe_variable": "S1601_C06_003M", "geography": {"for": "place:68516", "in": "state:13"}, "expected_name": "Sandy Springs city, Georgia", "expect": "percent"}'::jsonb,
  false, null, 6
),
-- ---------------------------------------------------------- United States (ACS 1-year)
(
  'us_poverty_rate',
  'employment',
  'census_acs1',
  'People living below the poverty line, United States',
  'The share of people in the United States whose household income is below the federal poverty line.',
  'This is an estimate from the American Community Survey 1-year release, which samples households over one year, so it carries a margin of error. It describes the nation as a whole, not any one household.',
  'percent',
  'United States',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "census", "dataset": "acs/acs1/subject", "variable": "S1701_C03_001E", "moe_variable": "S1701_C03_001M", "geography": {"for": "us:1"}, "expected_name": "United States", "expect": "percent"}'::jsonb,
  false, null, 7
),
(
  'us_child_poverty_rate',
  'youth',
  'census_acs1',
  'Children living below the poverty line, United States',
  'The share of children under 18 in the United States who live in households below the federal poverty line.',
  'This is an estimate from the American Community Survey 1-year release, which samples households over one year, so it carries a margin of error. It describes the nation as a whole, not any one household.',
  'percent',
  'United States',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "census", "dataset": "acs/acs1/subject", "variable": "S1701_C03_002E", "moe_variable": "S1701_C03_002M", "geography": {"for": "us:1"}, "expected_name": "United States", "expect": "percent"}'::jsonb,
  false, null, 5
),
(
  'us_renter_cost_burden',
  'housing',
  'census_acs1',
  'Renters paying 30% or more of income on rent, United States',
  'The share of U.S. households that pay rent and spend at least 30% of their income on it.',
  'Households that spend 30% or more of their income on housing are called cost-burdened. This is an estimate from the American Community Survey 1-year release, which samples households over one year, so it carries a margin of error.',
  'percent',
  'United States',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "census", "dataset": "acs/acs1/profile", "variable": "DP04_0141PE", "add_variables": ["DP04_0142PE"], "moe_variable": "DP04_0141PM", "add_moe_variables": ["DP04_0142PM"], "geography": {"for": "us:1"}, "expected_name": "United States", "expect": "percent"}'::jsonb,
  true,
  'Sum of two American Community Survey data profile rows, as shares of occupied units paying rent: gross rent 30.0 to 34.9 percent of household income (DP04_0141PE) plus 35.0 percent or more (DP04_0142PE). The margin of error combines the two margins as the square root of the sum of their squares.',
  4
),
-- ---------------------------------------------------------- United States (FRED)
(
  'us_unemployment_less_than_high_school',
  'employment',
  'fred',
  'Unemployment rate, adults without a high school diploma',
  'The share of people age 25 and over without a high school diploma who are in the labor force and out of work.',
  'This counts people actively looking for work, not everyone without a job. It is a national figure adjusted for the season, published about a month after the period it covers.',
  'percent',
  'United States',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "fred", "series_id": "LNS14027659", "transform": "level"}'::jsonb,
  false, null, 8
),
(
  'us_unemployment_high_school_graduates',
  'employment',
  'fred',
  'Unemployment rate, high school graduates with no college',
  'The share of people age 25 and over whose highest education is a high school diploma who are in the labor force and out of work.',
  'This counts people actively looking for work, not everyone without a job. It is a national figure adjusted for the season, published about a month after the period it covers.',
  'percent',
  'United States',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "fred", "series_id": "LNS14027660", "transform": "level"}'::jsonb,
  false, null, 9
),
(
  'us_unemployment_bachelors_degree',
  'employment',
  'fred',
  'Unemployment rate, adults with a bachelor''s degree or higher',
  'The share of people age 25 and over with a bachelor''s degree or higher who are in the labor force and out of work.',
  'This counts people actively looking for work, not everyone without a job. It is a national figure adjusted for the season, published about a month after the period it covers.',
  'percent',
  'United States',
  'meter',
  '{"decimals": 1}'::jsonb,
  '{"provider": "fred", "series_id": "LNS14027662", "transform": "level"}'::jsonb,
  false, null, 10
),
(
  'us_weekly_earnings_less_than_high_school',
  'employment',
  'fred',
  'Median weekly earnings, adults without a high school diploma',
  'The middle weekly pay, before taxes, of full-time wage and salary workers age 25 and over without a high school diploma.',
  'Half of these workers earn more and half earn less. This is a national figure, not adjusted for the season, published each quarter, and it does not describe any one job or employer.',
  'usd',
  'United States',
  'figure',
  '{}'::jsonb,
  '{"provider": "fred", "series_id": "LEU0252916700Q", "transform": "level", "frequency": "quarterly"}'::jsonb,
  false, null, 11
),
(
  'us_weekly_earnings_high_school_graduates',
  'employment',
  'fred',
  'Median weekly earnings, high school graduates with no college',
  'The middle weekly pay, before taxes, of full-time wage and salary workers age 25 and over whose highest education is a high school diploma.',
  'Half of these workers earn more and half earn less. This is a national figure, not adjusted for the season, published each quarter, and it does not describe any one job or employer.',
  'usd',
  'United States',
  'figure',
  '{}'::jsonb,
  '{"provider": "fred", "series_id": "LEU0252917300Q", "transform": "level", "frequency": "quarterly"}'::jsonb,
  false, null, 12
),
(
  'us_weekly_earnings_bachelors_degree',
  'employment',
  'fred',
  'Median weekly earnings, adults with a bachelor''s degree or higher',
  'The middle weekly pay, before taxes, of full-time wage and salary workers age 25 and over with a bachelor''s degree or higher.',
  'Half of these workers earn more and half earn less. This is a national figure, not adjusted for the season, published each quarter, and it does not describe any one job or employer.',
  'usd',
  'United States',
  'figure',
  '{}'::jsonb,
  '{"provider": "fred", "series_id": "LEU0252918500Q", "transform": "level", "frequency": "quarterly"}'::jsonb,
  false, null, 13
),
(
  'us_electricity_price_change',
  'housing',
  'fred',
  'Electricity prices, year over year',
  'How much more (or less) electricity costs across the United States than it did a year earlier, measured by the Consumer Price Index for electricity.',
  'This is a national average of price changes, not what any one household pays, and it does not include other energy sources such as natural gas. The change is measured against the same month a year earlier.',
  'percent_change',
  'United States (city average)',
  'figure',
  '{"signed": true, "decimals": 1}'::jsonb,
  '{"provider": "fred", "series_id": "CUUR0000SEHF01", "transform": "yoy_percent_change", "base_period": "1982-1984=100"}'::jsonb,
  true,
  'Percent change = (index in the latest month with data / index in the same month one year earlier - 1) x 100, using FRED series CUUR0000SEHF01 (CPI-U electricity, U.S. city average, not seasonally adjusted). Missing months are never filled in.',
  5
)
on conflict (statistic_key) do nothing;
