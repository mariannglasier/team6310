import type { CmsJob, CmsJobFields } from '../../../services/cms'
export const jobFields = [
  { key: 'title', label: 'Job title', section: 'Job details', required: true },
  {
    key: 'soc_code',
    label: 'SOC code',
    section: 'Job details',
    required: true,
    info: 'Occupation code NN-NNNN. It must be unique within this draft edition.',
  },
  {
    key: 'description',
    label: 'Job description',
    section: 'Job details',
    multiline: true,
  },
  {
    key: 'median_hourly_wage',
    label: 'Median hourly wage (USD)',
    section: 'Wages and area',
    info: 'Optional for an inactive draft job. Enter an explicit nonnegative amount with at most two decimal places. PostgreSQL calculates weekly gross after saving; no wage is supplied automatically.',
  },
  {
    key: 'hours_per_week',
    label: 'Hours per week',
    section: 'Wages and area',
    required: true,
    info: 'Explicit weekly hours, greater than zero and at most 168, with at most two decimal places. Combined with hourly wage by PostgreSQL.',
  },
  {
    key: 'wage_year',
    label: 'Wage year',
    section: 'Wages and area',
    info: 'Year of the wage observation, 2000–2100. Required by the database when Active is enabled.',
  },
  {
    key: 'area_code',
    label: 'Area code',
    section: 'Wages and area',
    required: true,
  },
  {
    key: 'area_name',
    label: 'Area name',
    section: 'Wages and area',
    required: true,
  },
  {
    key: 'geography_level',
    label: 'Geography level',
    section: 'Wages and area',
    required: true,
    options: [
      ['MSA', 'MSA'],
      ['STATE', 'State'],
    ],
  },
  {
    key: 'needs_english_skills',
    label: 'Needs English skills',
    section: 'Requirements',
    options: [
      ['true', 'Yes'],
      ['false', 'No'],
    ],
    info: 'Individual application eligibility uses this stored boolean. Unconfigured can be retained in drafts but does not satisfy individual application validation.',
  },
  {
    key: 'needs_computer_skills',
    label: 'Needs computer skills',
    section: 'Requirements',
    options: [
      ['true', 'Yes'],
      ['false', 'No'],
    ],
    info: 'Individual application eligibility uses this stored boolean. Other requirements metadata does not replace this flag.',
  },
  { key: 'entry_education', label: 'Entry education', section: 'Requirements' },
  {
    key: 'related_experience',
    label: 'Related experience',
    section: 'Requirements',
  },
  {
    key: 'on_job_training',
    label: 'On-the-job training',
    section: 'Requirements',
  },
  {
    key: 'requirements_notes',
    label: 'Requirements note',
    section: 'Requirements',
    multiline: true,
    info: 'The existing simulation_requirements.notes text is displayed by the individual job loader. Other stored JSON metadata is preserved unchanged; this note does not implement additional eligibility rules.',
  },
  {
    key: 'wage_source_url',
    label: 'Wage source URL',
    section: 'Sources and availability',
    required: true,
  },
  {
    key: 'requirements_source_url',
    label: 'Requirements source URL',
    section: 'Sources and availability',
  },
  {
    key: 'reviewed_at',
    label: 'Source reviewed at',
    section: 'Sources and availability',
    info: 'Optional source review timestamp, for example 2026-11-18T12:00:00Z. Required for an active job. PostgreSQL interprets the supplied timestamp; it is not automatically changed on save.',
  },
  {
    key: 'is_approved',
    label: 'Approved',
    section: 'Sources and availability',
    options: [
      ['false', 'No'],
      ['true', 'Yes'],
    ],
    info: 'Existing job availability flag, not publication or a separate approval workflow. Active requires Approved; draft edits remain invisible to gameplay.',
  },
  {
    key: 'is_active',
    label: 'Active',
    section: 'Sources and availability',
    options: [
      ['false', 'No'],
      ['true', 'Yes'],
    ],
    info: 'Only approved active jobs in published editions are selected by gameplay. Active additionally requires hourly wage, wage year and source review timestamp. This does not publish the draft.',
  },
] as const
export type JobKey = (typeof jobFields)[number]['key']
export type JobInput = Record<JobKey, string>
export function jobValues(job: CmsJob | null): JobInput {
  return Object.fromEntries(
    jobFields.map(({ key }) => {
      const value =
        key === 'requirements_notes'
          ? job?.simulation_requirements.notes
          : job?.[key]
      return [
        key,
        value == null
          ? !job && (key === 'is_active' || key === 'is_approved')
            ? 'false'
            : ''
          : key === 'requirements_notes' && typeof value !== 'string'
            ? ''
            : String(value),
      ]
    }),
  ) as JobInput
}
export function jobPatch(
  input: JobInput,
  initial: JobInput,
  isNew: boolean,
): CmsJobFields {
  const patch: Record<string, unknown> = {}
  for (const field of jobFields) {
    const key = field.key,
      value = input[key]
    if (!isNew && value === initial[key]) continue
    if ('required' in field && field.required && !value.trim())
      throw new Error(`Enter ${field.label.toLowerCase()}.`)
    if (isNew && value === '' && !('required' in field)) continue
    if (
      [
        'is_active',
        'is_approved',
        'needs_english_skills',
        'needs_computer_skills',
      ].includes(key)
    )
      patch[key] = value === '' ? null : value === 'true'
    else if (key === 'wage_year') {
      if (
        value &&
        (!/^[0-9]+$/.test(value) ||
          Number(value) < 2000 ||
          Number(value) > 2100)
      )
        throw new Error('Wage year must be a whole year from 2000 to 2100.')
      patch[key] = value === '' ? null : Number(value)
    } else if (key === 'median_hourly_wage' || key === 'hours_per_week') {
      if (value === '' && key === 'median_hourly_wage') {
        patch[key] = null
        continue
      }
      if (
        !/^[0-9]+(\.[0-9]{1,2})?$/.test(value) ||
        (key === 'median_hourly_wage'
          ? Number(value) >= 100000000
          : Number(value) <= 0 || Number(value) > 168)
      )
        throw new Error(
          'Enter a finite exact hourly wage below $100 million and weekly hours greater than zero through 168, with at most two decimal places.',
        )
      patch[key] = value
    } else {
      if (key === 'soc_code' && !/^[0-9]{2}-[0-9]{4}$/.test(value))
        throw new Error('SOC code must have format NN-NNNN.')
      patch[key] = value === '' ? null : value
    }
  }
  return patch as CmsJobFields
}
