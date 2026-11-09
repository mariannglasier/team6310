import { loadScenario } from '../services/scenarioContent'
import type { Scenario } from '../types/domain'

export const LOCAL_SCENARIO_ID = '63100000-0000-4000-8000-000000000004'
export const LOCAL_VERSION_ID = '3c463a7f-7036-4e0c-9c1b-1f5db7c502f3'
// Development preview only. Refuse hosted targets before importing the client.
export async function loadLocalScenario(): Promise<Scenario | null> {
  if (
    !import.meta.env.DEV ||
    import.meta.env.VITE_SUPABASE_URL !== 'http://127.0.0.1:55321'
  )
    throw new Error('Local verification URL required')
  return loadScenario(LOCAL_SCENARIO_ID, LOCAL_VERSION_ID)
}
