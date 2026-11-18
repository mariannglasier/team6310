import { getSupabaseClient } from './supabase'

import { gameplayText } from '../lib/gameplayText'

export interface ResultComparison {
  category: string
  question: string
  answer: string
  responses: number | null
  options: { id: string; label: string; percent: number }[]
}

export async function loadResultComparisons(
  runId: string,
): Promise<ResultComparison[]> {
  const client = await getSupabaseClient()
  const { data, error } = await client.rpc(
    'get_individual_result_comparisons',
    {
      p_run_id: runId,
    },
  )
  if (error) throw error
  if (!Array.isArray(data)) throw new Error('Invalid comparison response')
  return (data as ResultComparison[]).map((row) => ({
    ...row,
    question: gameplayText(row.question),
    answer: gameplayText(row.answer),
    options: row.options.map((option) => ({
      ...option,
      label: gameplayText(option.label),
    })),
  }))
}
