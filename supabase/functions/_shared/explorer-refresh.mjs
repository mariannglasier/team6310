// Database-facing runner for the Explore Data refresh. It accepts any
// supabase-js compatible client created with the SERVICE ROLE, so the Edge
// Function and local verification share the same code path.
import { refreshCensusStatistics } from './explorer-census.mjs'
import { refreshEiaStatistics } from './explorer-eia.mjs'
import { refreshFredStatistics } from './explorer-fred.mjs'
import { refreshSocrataStatistics } from './explorer-socrata.mjs'

const PROVIDERS = [
  { id: 'fred', keyName: 'fred', refresh: refreshFredStatistics },
  { id: 'eia', keyName: 'eia', refresh: refreshEiaStatistics },
  { id: 'census', keyName: 'census', refresh: refreshCensusStatistics },
  // Fulton County open data needs no API key.
  { id: 'socrata', keyName: 'socrata', refresh: refreshSocrataStatistics },
]

/**
 * @param {object} options
 * @param {object} options.client       supabase-js client (service role)
 * @param {{fred?: string, eia?: string, census?: string}} options.apiKeys
 *        Provider keys (never logged or returned). A provider with no key
 *        reports an error for its own statistics and does not stop the others.
 * @param {typeof fetch} options.fetchImpl
 * @param {boolean} [options.dryRun]    fetch and compute, but record nothing
 */
export async function runExplorerRefresh({ client, apiKeys = {}, fetchImpl, dryRun = false }) {
  const record = async (args) => {
    if (dryRun) return { observation_id: null, status: 'dry_run' }
    const { data, error: rpcError } = await client.rpc('record_explorer_observation', {
      p_statistic_key: args.statistic_key,
      p_value: args.value,
      p_value_high: args.value_high,
      p_period_label: args.period_label,
      p_period_start: args.period_start,
      p_period_end: args.period_end,
      p_revision_key: args.revision_key,
      p_retrieval_method: args.retrieval_method,
    })
    if (rpcError) throw new Error(rpcError.message)
    const row = Array.isArray(data) ? data[0] : data
    if (!row?.result_status) throw new Error('record_explorer_observation returned no status')
    return { observation_id: row.result_observation_id, status: row.result_status }
  }

  const results = []
  for (const provider of PROVIDERS) {
    const { data: statistics, error } = await client
      .from('explorer_statistics')
      .select('statistic_key, source_reference')
      .eq('active', true)
      .eq('source_reference->>provider', provider.id)
      .order('statistic_key')

    if (error) {
      throw new Error(`Could not load explorer statistics: ${error.message}`)
    }
    if (!statistics?.length) continue

    results.push(
      ...(await provider.refresh({
        statistics,
        apiKey: apiKeys[provider.keyName] ?? '',
        fetchImpl,
        record,
      })),
    )
  }
  return results
}
