import { useState } from 'react'
import {
  SAMPLE_JOBS,
  educationLabels,
  jobBlockers,
  openJobCount,
  type Education,
  type EnglishLevel,
  type JobProfile,
} from './dataExplorerLogic'
import {
  ChoiceGroup,
  ExplorerIcon,
  ExplorerLayout,
  type VizProps,
} from './ExplorerParts'

const educationOptions: { value: Education; label: string }[] = [
  { value: 'none', label: 'No diploma' },
  { value: 'diploma', label: 'Diploma or GED' },
  { value: 'college', label: 'College degree' },
]
const englishOptions: { value: EnglishLevel; label: string }[] = [
  { value: 'limited', label: 'Less than “very well”' },
  { value: 'proficient', label: '“Very well”' },
]
const digitalOptions: { value: 'no' | 'yes'; label: string }[] = [
  { value: 'no', label: 'No computer skills' },
  { value: 'yes', label: 'Computer skills' },
]

export function EmploymentViz({ category, mode, onModeChange }: VizProps) {
  const [education, setEducation] = useState<Education>('none')
  const [english, setEnglish] = useState<EnglishLevel>('limited')
  const [digital, setDigital] = useState(false)

  const chosen: JobProfile = { education, english, digital }
  const classes = mode === 'impact'
  // Classes change English and computer skills; education stays as chosen.
  const profile: JobProfile = classes
    ? { education, english: 'proficient', digital: true }
    : chosen
  const total = SAMPLE_JOBS.length
  const open = openJobCount(profile)
  const before = openJobCount(chosen)

  return (
    <ExplorerLayout
      category={category}
      mode={mode}
      onModeChange={onModeChange}
      sceneLabel="Sample job board"
      scene={
        <div className="job-scene">
          <div className="job-scene__header">
            <p className="job-scene__count" role="status">
              <strong>
                {open} of {total}
              </strong>{' '}
              sample postings open
              {classes && before !== open && (
                <span className="job-scene__delta">
                  {' '}
                  (up from {before} before classes)
                </span>
              )}
            </p>
            <div
              className="job-scene__meter"
              role="img"
              aria-label={`${open} of ${total} postings open`}
            >
              <span style={{ width: `${(open / total) * 100}%` }} />
            </div>
          </div>
          <ul className="job-board">
            {SAMPLE_JOBS.map((job) => {
              const blockers = jobBlockers(job, profile)
              const isOpen = blockers.length === 0
              return (
                <li
                  key={job.id}
                  className={`job-card${isOpen ? ' is-open' : ' is-closed'}`}
                >
                  <span className="job-card__title">{job.title}</span>
                  <span className="job-card__tags">
                    <span>{educationLabels[job.education]}</span>
                    {job.strongEnglish && <span>Strong English</span>}
                    {job.digital && <span>Computer skills</span>}
                  </span>
                  <span className="job-card__status">
                    {isOpen ? (
                      <>
                        <ExplorerIcon kind="check" size={14} />
                        Open to you
                      </>
                    ) : (
                      <>Closed: {blockers.join(', ')}</>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      }
      controls={
        <>
          <ChoiceGroup
            label="Education"
            value={education}
            onChange={setEducation}
            options={educationOptions}
          />
          <ChoiceGroup
            label="Speaks English"
            value={classes ? 'proficient' : english}
            onChange={setEnglish}
            options={englishOptions}
            disabled={classes}
            hint={
              classes
                ? 'Set by CAC English as a Second or Other Language classes.'
                : undefined
            }
          />
          <ChoiceGroup
            label="Computer skills"
            value={classes || digital ? 'yes' : 'no'}
            onChange={(value) => setDigital(value === 'yes')}
            options={digitalOptions}
            disabled={classes}
            hint={classes ? 'Set by CAC computer skills classes.' : undefined}
          />
        </>
      }
    />
  )
}
