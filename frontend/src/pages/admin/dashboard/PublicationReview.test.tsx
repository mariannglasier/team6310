import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ScenarioWorkspace } from './ScenarioWorkspace'
import * as cms from '../../../services/cms'
vi.mock('../../../services/cms')
const content: cms.CmsContent = {
  workspace: {
    version_id: 'draft',
    source_version: 'source',
    name: 'Publication workshop',
    revision: 0,
    updated_at: '',
  },
  scenarios: [],
  personas: [],
  categories: [],
}
const result: cms.CmsPublicationResult = {
  version_id: 'draft',
  version_number: 3,
  revision: 1,
  published_at: '2026-11-18T12:00:00Z',
  published_by: 'staff',
  validator: 'cms-publication-v1',
}
const report: cms.CmsPublicationReport = {
  version_id: 'draft',
  version_number: 3,
  revision: 0,
  validator: 'cms-publication-v1',
  heads: { individual: 'source', group: 'source' },
  can_publish: true,
  findings: [
    {
      code: 'FACT-DISPLAY-INELIGIBLE',
      severity: 'warning',
      origin: 'content',
      message: 'Authored fact remains ineligible.',
      description: 'Eligibility is a display setting.',
      basis: 'Verified runtime',
      affected: [
        { scenario_id: 'scenario', fact_role: 'general', verified: false },
      ],
    },
  ],
}
beforeEach(() => {
  vi.resetAllMocks()
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
  vi.mocked(cms.listCmsDrafts).mockResolvedValue([content.workspace])
  vi.mocked(cms.listCmsPublications).mockResolvedValue([])
  vi.mocked(cms.readCmsDraft).mockResolvedValue(content)
  vi.mocked(cms.preflightCmsPublication).mockResolvedValue(report)
})
async function open() {
  const user = userEvent.setup()
  render(<ScenarioWorkspace editions={[]} />)
  await user.click(
    await screen.findByRole('button', { name: 'Publication workshop' }),
  )
  return user
}
async function review() {
  const user = await open()
  await user.click(screen.getByRole('button', { name: 'Review publication' }))
  await screen.findByRole('dialog', { name: 'Publication review' })
  return user
}
function saved() {
  vi.mocked(cms.publishCmsDraft).mockResolvedValue(result)
  vi.mocked(cms.readCmsDraft).mockResolvedValue({
    ...content,
    workspace: { ...content.workspace, revision: 1 },
    edition: {
      version_id: 'draft',
      version_number: 3,
      status: 'published',
      published_at: result.published_at,
    },
    publication: result,
  })
  vi.mocked(cms.listCmsDrafts).mockResolvedValue([])
  vi.mocked(cms.listCmsPublications).mockResolvedValue([
    { ...result, name: content.workspace.name, source_version: 'source' },
  ])
}
test('review has only two nested categories with plain labels and independent hidden explanations', async () => {
  vi.mocked(cms.preflightCmsPublication).mockResolvedValue({
    ...report,
    findings: [
      ...report.findings,
      {
        ...report.findings[0],
        code: 'INFO-EDITION-SNAPSHOT',
        severity: 'information',
      },
    ],
  })
  const user = await review()
  expect(screen.getByText('Blockers (0)')).toBeVisible()
  expect(screen.queryByText(/^Information/)).not.toBeInTheDocument()
  await user.click(screen.getByText('Warnings (1)'))
  expect(screen.queryByText('FACT-DISPLAY-INELIGIBLE')).not.toBeInTheDocument()
  expect(screen.queryByText('Verified runtime')).not.toBeInTheDocument()
  expect(
    screen.getByText('Eligibility is optional.', { exact: false }),
  ).not.toBeVisible()
  const summary = screen.getByText('Fact is not eligible for gameplay display')
  expect(summary.closest('.cms-publication-findings')).not.toBeNull()
  expect(summary.closest('.cms-publication-category--warning')).not.toBeNull()
  await user.click(summary)
  expect(
    screen.getByText('Eligibility is optional.', { exact: false }),
  ).toBeVisible()
  expect(
    screen.getByRole('button', { name: 'Continue to confirmation' }),
  ).toBeEnabled()
  expect(cms.publishCmsDraft).not.toHaveBeenCalled()
})
test('structural blockers prevent confirmation with a compact red finding', async () => {
  vi.mocked(cms.preflightCmsPublication).mockResolvedValue({
    ...report,
    can_publish: false,
    findings: [
      { ...report.findings[0], code: 'PER-CATALOG', severity: 'blocker' },
    ],
  })
  const user = await review()
  expect(
    screen.getByRole('button', { name: 'Continue to confirmation' }),
  ).toBeDisabled()
  const title = screen.getByText('Add at least one persona')
  expect(title.closest('.cms-publication-category--blocker')).not.toBeNull()
  await user.click(title)
  expect(screen.getByText(/Players must select a persona/)).toBeVisible()
  expect(screen.queryByText('PER-CATALOG')).not.toBeInTheDocument()
})
test('unsaved Scenario edits prevent saved-edition review', async () => {
  const user = await open()
  await user.click(screen.getByRole('button', { name: 'New scenario' }))
  await user.type(screen.getByLabelText(/^Scenario title/), 'Unsaved')
  expect(
    screen.getByRole('button', { name: 'Review publication' }),
  ).toBeDisabled()
  expect(
    screen.getByText(
      'Save or reload unsaved changes before reviewing publication.',
    ),
  ).toBeVisible()
  expect(cms.preflightCmsPublication).not.toHaveBeenCalled()
})
test('publication requires named confirmation and database readback, then shows immutable persisted result', async () => {
  const user = await review()
  saved()
  await user.click(
    screen.getByRole('button', { name: 'Continue to confirmation' }),
  )
  const dialog = screen.getByRole('dialog', { name: 'Publish this edition?' })
  expect(dialog).toHaveTextContent('Publication workshop')
  expect(cms.publishCmsDraft).not.toHaveBeenCalled()
  await user.click(
    within(dialog).getByRole('button', { name: 'Publish edition' }),
  )
  expect(
    await screen.findByRole('heading', { name: 'Published edition 3' }),
  ).toBeVisible()
  expect(screen.queryByRole('tab', { name: /Scenarios/ })).toBeNull()
  expect(
    screen.queryByRole('button', { name: 'Review publication' }),
  ).toBeNull()
  expect(
    screen.getByRole('button', { name: 'Create draft from this edition' }),
  ).toBeVisible()
  expect(cms.publishCmsDraft).toHaveBeenCalledWith(report, expect.any(String))
})
test('readback failure retains the original publication request and locks editing', async () => {
  const user = await review()
  saved()
  vi.mocked(cms.readCmsDraft).mockRejectedValueOnce(
    new Error('Read unavailable'),
  )
  await user.click(
    screen.getByRole('button', { name: 'Continue to confirmation' }),
  )
  await user.click(screen.getByRole('button', { name: 'Publish edition' }))
  expect(
    await screen.findByText(/Publication awaiting confirmation/),
  ).toBeVisible()
  expect(screen.getByRole('button', { name: 'Reload draft' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Back to review' })).toBeDisabled()
  await user.click(
    screen.getByRole('button', { name: 'Retry publication confirmation' }),
  )
  await screen.findByRole('heading', { name: 'Published edition 3' })
  expect(vi.mocked(cms.publishCmsDraft).mock.calls[1]).toEqual(
    vi.mocked(cms.publishCmsDraft).mock.calls[0],
  )
})
test('stale publication preserves workspace and allows a new review', async () => {
  const user = await review()
  vi.mocked(cms.publishCmsDraft).mockRejectedValue(
    new Error('Publication review is stale. Run review again.'),
  )
  await user.click(
    screen.getByRole('button', { name: 'Continue to confirmation' }),
  )
  await user.click(screen.getByRole('button', { name: 'Publish edition' }))
  await waitFor(() => expect(cms.publishCmsDraft).toHaveBeenCalledOnce())
  expect(
    screen.queryByRole('heading', { name: 'Published edition 3' }),
  ).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Back to review' }))
  await user.click(screen.getByRole('button', { name: 'Run review again' }))
  expect(cms.preflightCmsPublication).toHaveBeenCalledTimes(2)
})
test('overtaken recovery explicitly copies latest source and preserves the old workspace', async () => {
  vi.mocked(cms.preflightCmsPublication).mockResolvedValue({
    ...report,
    can_publish: false,
    heads: { individual: 'latest', group: 'latest' },
    findings: [
      { ...report.findings[0], severity: 'blocker', code: 'PUB-ORDER' },
    ],
  })
  const user = await review()
  await user.click(
    screen.getByRole('button', {
      name: 'Create fresh draft from latest edition',
    }),
  )
  const dialog = screen.getByRole('dialog', { name: 'Create a fresh draft?' })
  expect(dialog).toHaveTextContent('not automatically copied or merged')
  await user.type(screen.getByLabelText(/^Fresh draft name/), 'Latest baseline')
  vi.mocked(cms.recoverCmsDraft).mockResolvedValue('fresh')
  vi.mocked(cms.readCmsDraft).mockResolvedValue({
    ...content,
    workspace: {
      ...content.workspace,
      version_id: 'fresh',
      source_version: 'latest',
      name: 'Latest baseline',
    },
  })
  await user.click(
    within(dialog).getByRole('button', { name: 'Create fresh draft' }),
  )
  expect(
    await screen.findByRole('heading', { name: 'Latest baseline' }),
  ).toBeVisible()
  expect(cms.recoverCmsDraft).toHaveBeenCalledWith(
    expect.objectContaining({
      heads: { individual: 'latest', group: 'latest' },
    }),
    'Latest baseline',
    expect.any(String),
  )
})
test('published history survives reopening without mounting authoring forms', async () => {
  vi.mocked(cms.listCmsDrafts).mockResolvedValue([])
  vi.mocked(cms.listCmsPublications).mockResolvedValue([
    { ...result, name: content.workspace.name, source_version: 'source' },
  ])
  saved()
  const user = userEvent.setup()
  render(<ScenarioWorkspace editions={[]} />)
  await user.click(
    await screen.findByRole('button', {
      name: 'Edition 3 · Publication workshop',
    }),
  )
  expect(
    await screen.findByRole('heading', { name: 'Published edition 3' }),
  ).toBeVisible()
  expect(screen.queryByRole('button', { name: 'Save Changes' })).toBeNull()
})

test('a newer saved revision found during preflight explains how to reload before confirmation', async () => {
  vi.mocked(cms.preflightCmsPublication).mockResolvedValue({
    ...report,
    revision: 1,
  })
  await review()
  expect(
    screen.getByRole('dialog', { name: 'Publication review' }),
  ).toHaveTextContent('Close review and Reload draft')
  expect(
    screen.getByRole('button', { name: 'Continue to confirmation' }),
  ).toBeDisabled()
  expect(cms.publishCmsDraft).not.toHaveBeenCalled()
})

test('scenario findings navigate to the affected existing editor', async () => {
  vi.mocked(cms.readCmsDraft).mockResolvedValue({
    ...content,
    scenarios: [
      {
        scenario_id: 'scenario',
        title: 'Decision for Day 4',
        description: 'Existing narrative',
        category_id: null,
        persona_intent: null,
        schedule_type: 'non_scheduled',
      },
    ],
  })
  const user = await review()
  await user.click(screen.getByText('Warnings (1)'))
  await user.click(
    screen.getByText('Fact is not eligible for gameplay display'),
  )
  await user.click(
    screen.getByRole('button', { name: 'Open scenario: Decision for Day 4' }),
  )
  expect(
    screen.queryByRole('dialog', { name: 'Publication review' }),
  ).not.toBeInTheDocument()
  expect(screen.getByLabelText(/^Scenario title/)).toHaveValue(
    'Decision for Day 4',
  )
  expect(cms.publishCmsDraft).not.toHaveBeenCalled()
})
