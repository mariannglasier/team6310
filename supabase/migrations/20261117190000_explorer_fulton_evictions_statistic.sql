-- Explore Data statistic definition: Fulton County monthly eviction filings.
--
-- Approved source (docs/explorer-statistics-catalog.md): Fulton County open data,
-- dataset cbu2-qs5w "Monthly Eviction Filings", on sharefulton.fultoncountyga.gov.
-- Columns verified against the live endpoint on November 17, 2026: month
-- (YYYY-MM text), monthdate (first day of the month) and filings (number).
-- This defines the statistic only. It seeds NO value: the first observation is
-- staged by the refresh and approved once by staff; later refreshes publish
-- automatically (see record_explorer_observation).
--
-- The county reports Fulton County as a whole, not Sandy Springs or Dunwoody.
--
-- Depends on 20261117150000_explorer_statistics.sql.

insert into public.explorer_statistics (
  statistic_key, category_key, source_id, title, description, context_note,
  unit, geography, visualization_type, visualization_config, source_reference,
  is_derived, display_order
)
values (
  'fulton_eviction_filings',
  'housing',
  'fulton_evictions',
  'Eviction filings in a month, Fulton County',
  'The number of eviction cases (dispossessory filings) landlords filed in Fulton County''s Superior and Magistrate Courts in the latest month reported.',
  'A filing starts a court case. It does not mean the household lost its home. The count covers all of Fulton County, not Sandy Springs or Dunwoody, and the county publishes it monthly.',
  'count',
  'Fulton County, GA',
  'figure',
  '{}'::jsonb,
  '{"provider": "socrata", "domain": "sharefulton.fultoncountyga.gov", "dataset_id": "cbu2-qs5w", "period_field": "month", "value_field": "filings"}'::jsonb,
  false,
  2
)
on conflict (statistic_key) do nothing;
