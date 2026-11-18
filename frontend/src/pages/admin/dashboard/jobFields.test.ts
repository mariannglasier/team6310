import { expect, test } from 'vitest'
import { jobValues, jobPatch } from './jobFields'
import type { CmsJob } from '../../../services/cms'

export const job: CmsJob = {
  job_id: 'job',
  version_id: 'draft',
  soc_code: '11-1111',
  title: 'Legacy job',
  description: null,
  area_code: '12060',
  area_name: 'Atlanta',
  geography_level: 'MSA',
  wage_year: null,
  median_hourly_wage: '10.25',
  hours_per_week: '37.50',
  weekly_gross_income: '384.38',
  entry_education: null,
  related_experience: null,
  on_job_training: null,
  simulation_requirements: { notes: { legacy: true }, retained: ['metadata'] },
  wage_source_url: '',
  requirements_source_url: null,
  reviewed_at: null,
  last_synced_at: null,
  created_at: '2026-01-01T00:00:00Z',
  is_approved: false,
  is_active: false,
  needs_english_skills: null,
  needs_computer_skills: null,
}
test('new jobs require explicit authored values and supply no wage or hours defaults', () => {
  const initial = jobValues(null)
  expect(initial.hours_per_week).toBe('')
  expect(initial.median_hourly_wage).toBe('')
  expect(() => jobPatch(initial, initial, true)).toThrow('job title')
  const input = {
    ...initial,
    title: 'New',
    soc_code: '11-2222',
    hours_per_week: '35.25',
    area_code: 'A',
    area_name: 'Area',
    geography_level: 'STATE',
    wage_source_url: 'Source',
  }
  expect(jobPatch(input, initial, true)).toEqual({
    title: 'New',
    soc_code: '11-2222',
    hours_per_week: '35.25',
    area_code: 'A',
    area_name: 'Area',
    geography_level: 'STATE',
    wage_source_url: 'Source',
    is_approved: false,
    is_active: false,
  })
})
test('legacy nulls, empty source and nontext JSON notes survive unrelated changes', () => {
  const initial = jobValues(job)
  expect(jobPatch({ ...initial, title: 'Renamed' }, initial, false)).toEqual({
    title: 'Renamed',
  })
  expect(
    jobPatch({ ...initial, requirements_notes: 'Authored' }, initial, false),
  ).toEqual({ requirements_notes: 'Authored' })
  expect(
    jobPatch({ ...initial, needs_english_skills: 'false' }, initial, false),
  ).toEqual({ needs_english_skills: false })
})
test.each(['-1', 'NaN', 'Infinity', '1.001', '100000000'])(
  'rejects invalid wage %s',
  (value) => {
    const initial = jobValues(job)
    expect(() =>
      jobPatch({ ...initial, median_hourly_wage: value }, initial, false),
    ).toThrow('finite exact')
  },
)
test.each(['0', '-1', '168.01', '2.001'])(
  'rejects invalid hours %s',
  (value) => {
    const initial = jobValues(job)
    expect(() =>
      jobPatch({ ...initial, hours_per_week: value }, initial, false),
    ).toThrow('weekly hours')
  },
)
test('optional wage and skill fields can explicitly become unconfigured', () => {
  const initial = jobValues({ ...job, needs_english_skills: true })
  expect(
    jobPatch(
      { ...initial, median_hourly_wage: '', needs_english_skills: '' },
      initial,
      false,
    ),
  ).toEqual({ median_hourly_wage: null, needs_english_skills: null })
})
