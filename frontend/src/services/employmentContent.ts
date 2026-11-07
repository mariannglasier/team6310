import { contentService } from './contentService'
import { getSupabaseClient } from './supabase'
import type { LoadedPlaythrough } from '../types/playthrough'
import {
  createWalkthrough,
  PROFESSIONAL_CLOTHING_COST,
  validateSkillsCatalog,
  walkthroughJobs,
} from '../state/employmentWalkthrough'

// Phase 1 reads only: the saved run supplies identity, edition and money.
export async function loadEmploymentPreview(
  run: LoadedPlaythrough,
  replaySupport: boolean,
) {
  if (
    !run.versionId ||
    !run.persona ||
    run.currentBalance === null ||
    run.currentDay !== 1 ||
    run.status !== 'active' ||
    run.currentJobId !== null ||
    run.currentScenarioId !== null ||
    run.employmentState !== null ||
    run.sessionId !== null
  ) {
    throw new Error(
      'Employment preview requires a newly started individual playthrough. Existing recorded progress will not be reset.',
    )
  }
  const client = await getSupabaseClient()
  const { data, error } = await client
    .from('personas')
    .select('persona_id,version_id,has_english_skills,has_computer_skills')
    .eq('persona_id', run.personaId)
    .eq('version_id', run.versionId)
    .maybeSingle()
  if (
    error ||
    !data ||
    data.persona_id !== run.personaId ||
    data.version_id !== run.versionId
  ) {
    throw new Error(
      'Employment skills are unavailable for this household edition. Please retry or contact the facilitator.',
    )
  }
  const persona = {
    id: run.personaId,
    versionId: run.versionId,
    name: run.persona.name,
    description: run.persona.description ?? '',
    // createWalkthrough accepts a seed balance; use the saved run, never catalog starting money.
    startingBalance: run.currentBalance,
    hasEnglishSkills: data.has_english_skills,
    hasComputerSkills: data.has_computer_skills,
  }
  const jobs = await contentService.loadJobs(run.versionId)
  const issue = validateSkillsCatalog(persona, jobs)
  if (issue)
    throw new Error(
      'Employment skills or eligible jobs are not fully configured for this household edition. Please contact the facilitator.',
    )
  return createWalkthrough(
    persona,
    walkthroughJobs(jobs),
    run.supportEnabled ?? replaySupport,
    PROFESSIONAL_CLOTHING_COST,
  )
}
