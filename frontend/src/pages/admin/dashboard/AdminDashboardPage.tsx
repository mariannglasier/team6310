import { useMemo, useState } from 'react'
import { paths } from '../../../app/paths'
import { AdminTabs } from '../../../components/admin/AdminTabs'
import {
  Badge,
  FilterSelect,
  StatCard,
} from '../../../components/admin/AdminBits'
import { formatDate, plural } from '../../../components/admin/format'
import { Button, ButtonLink } from '../../../components/ui/Button'
import { useAdminContent } from '../../../hooks/useAdminContent'
import { useStaffAuth } from '../../../state/staffAuthContext'
import type { AdminContent, AdminEdition } from '../../../types/adminContent'
import { JobsPanel } from './JobsPanel'
import { PersonasPanel } from './PersonasPanel'
import { ScenariosPanel } from './ScenariosPanel'
import { ServicesPanel } from './ServicesPanel'
import { StatisticsPanel } from './StatisticsPanel'
import './admin.css'

type TabId = 'scenarios' | 'personas' | 'jobs' | 'statistics' | 'services'

function latestEdition(editions: readonly AdminEdition[]) {
  const ordered = [...editions].sort(
    (a, b) => b.versionNumber - a.versionNumber,
  )
  return ordered.find((edition) => edition.status === 'published') ?? ordered[0]
}

export function AdminDashboardPage() {
  const { state: auth, signOut } = useStaffAuth()
  const { state, reload } = useAdminContent()
  const [signingOut, setSigningOut] = useState(false)

  return (
    <section className="admin" aria-labelledby="page-heading">
      <header className="admin-hero">
        <div>
          <p className="admin-hero__eyebrow">CAC staff</p>
          <h1 id="page-heading" tabIndex={-1}>
            Employee dashboard
          </h1>
          <p className="admin-hero__lead">
            A read-only view of the simulation content stored in Supabase.
          </p>
        </div>
        <div className="admin-hero__actions">
          {auth.status === 'staff' && (
            <p className="admin-hero__user">
              Signed in as <strong>{auth.session.email}</strong>
            </p>
          )}
          <div className="admin-hero__buttons">
            <Button
              variant="secondary"
              onClick={reload}
              loading={state.status === 'loading'}
            >
              Refresh
            </Button>
            <ButtonLink to={paths.home} variant="secondary">
              Main site
            </ButtonLink>
            <Button
              variant="secondary"
              loading={signingOut}
              onClick={() => {
                setSigningOut(true)
                void signOut()
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {state.status === 'loading' && (
        <p className="admin-notice" role="status">
          Loading stored content…
        </p>
      )}
      {state.status === 'error' && (
        <div className="admin-notice admin-notice--error" role="alert">
          <p>{state.message}</p>
          <Button variant="secondary" onClick={reload}>
            Try again
          </Button>
        </div>
      )}
      {state.status === 'ready' && <Overview content={state.content} />}
    </section>
  )
}

function Overview({ content }: { content: AdminContent }) {
  const [tab, setTab] = useState<TabId>('scenarios')
  const [chosenEdition, setChosenEdition] = useState<string | null>(null)

  const editions = useMemo(
    () =>
      [...content.editions].sort((a, b) => b.versionNumber - a.versionNumber),
    [content.editions],
  )
  const edition =
    editions.find((entry) => entry.versionId === chosenEdition) ??
    latestEdition(editions)

  const scoped = useMemo(() => {
    const versionId = edition?.versionId
    const inEdition = <T extends { versionId: string | null }>(
      rows: readonly T[],
    ) => rows.filter((row) => row.versionId === versionId)
    return {
      personas: inEdition(content.personas),
      personaExpenses: inEdition(content.personaExpenses),
      scenarios: inEdition(content.scenarios),
      choices: inEdition(content.choices),
      supportEffects: inEdition(content.supportEffects),
      jobs: inEdition(content.jobs),
      statistics: inEdition(content.statistics),
      scenarioStatistics: inEdition(content.scenarioStatistics),
    }
  }, [content, edition?.versionId])

  const scheduled = scoped.scenarios.filter(
    (scenario) => scenario.scheduleType === 'scheduled',
  ).length

  const tabs = [
    { id: 'scenarios', label: 'Scenarios', count: scoped.scenarios.length },
    { id: 'personas', label: 'Personas', count: scoped.personas.length },
    { id: 'jobs', label: 'Jobs', count: scoped.jobs.length },
    {
      id: 'statistics',
      label: 'Statistics',
      count: scoped.statistics.length,
    },
    {
      id: 'services',
      label: 'CAC Service Facts',
      count: content.serviceFacts.length,
    },
  ] as const

  if (!edition)
    return (
      <p className="admin-notice">
        No content editions are visible to this account yet.
      </p>
    )

  return (
    <>
      <section className="admin-edition" aria-labelledby="admin-edition-title">
        <div className="admin-edition__main">
          <h2 id="admin-edition-title">
            Edition {edition.versionNumber}{' '}
            <Badge tone={edition.status === 'published' ? 'green' : 'amber'}>
              {edition.status === 'published' ? 'Published' : edition.status}
            </Badge>
          </h2>
          <p className="admin-muted">
            {edition.publishedAt
              ? `Published ${formatDate(edition.publishedAt)}`
              : `Created ${formatDate(edition.createdAt)}`}
            {edition.versionId === latestEdition(editions)?.versionId &&
              ' · Newest published edition'}
          </p>
          {edition.changeSummary && (
            <p className="admin-edition__summary">{edition.changeSummary}</p>
          )}
        </div>
        {editions.length > 1 && (
          <FilterSelect
            label="Edition"
            value={edition.versionId}
            onChange={setChosenEdition}
            options={editions.map((entry) => ({
              value: entry.versionId,
              label: `Edition ${entry.versionNumber} (${entry.status})`,
            }))}
          />
        )}
      </section>

      <section className="admin-stats" aria-label="Content summary">
        <StatCard
          label="Scenarios"
          value={scoped.scenarios.length}
          detail={`${scheduled} scheduled · ${scoped.scenarios.length - scheduled} non-scheduled`}
          selected={tab === 'scenarios'}
          onSelect={() => setTab('scenarios')}
        />
        <StatCard
          label="Personas"
          value={scoped.personas.length}
          selected={tab === 'personas'}
          onSelect={() => setTab('personas')}
        />
        <StatCard
          label="Jobs"
          value={scoped.jobs.length}
          selected={tab === 'jobs'}
          onSelect={() => setTab('jobs')}
        />
        <StatCard
          label="Statistics"
          value={scoped.statistics.length}
          detail={plural(scoped.scenarioStatistics.length, 'scenario link')}
          selected={tab === 'statistics'}
          onSelect={() => setTab('statistics')}
        />
        <StatCard
          label="CAC services"
          value={content.services.length}
          detail={plural(content.serviceFacts.length, 'fact')}
          selected={tab === 'services'}
          onSelect={() => setTab('services')}
        />
      </section>

      <AdminTabs
        label="Stored content"
        tabs={tabs}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
      >
        {tab === 'scenarios' && (
          <ScenariosPanel
            scenarios={scoped.scenarios}
            categories={content.categories}
            personas={scoped.personas}
            choices={scoped.choices}
            supportEffects={scoped.supportEffects}
            statistics={scoped.statistics}
            links={scoped.scenarioStatistics}
          />
        )}
        {tab === 'personas' && (
          <PersonasPanel
            personas={scoped.personas}
            expenses={scoped.personaExpenses}
            scenarios={scoped.scenarios}
            jobs={scoped.jobs}
          />
        )}
        {tab === 'jobs' && <JobsPanel jobs={scoped.jobs} />}
        {tab === 'statistics' && (
          <StatisticsPanel
            statistics={scoped.statistics}
            links={scoped.scenarioStatistics}
            scenarios={scoped.scenarios}
          />
        )}
        {tab === 'services' && (
          <ServicesPanel
            services={content.services}
            facts={content.serviceFacts}
          />
        )}
      </AdminTabs>
    </>
  )
}
