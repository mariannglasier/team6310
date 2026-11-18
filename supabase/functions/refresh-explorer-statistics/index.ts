// Edge Function: refresh Explore Data statistics from FRED, EIA, Census and Fulton County open data.
//
// Server-side only. Secrets (set in Supabase Dashboard -> Edge Functions ->
// Secrets, never in the browser or Git):
//   FRED_API_KEY      FRED API key
//   EIA_API_KEY       EIA API key (the same project secret the game-data
//                     refresh uses; this function never reads or logs it
//                     beyond sending it to the EIA API)
//   CENSUS_API_KEY    Census API key (also the game-data refresh's secret)
// Fulton County open data (eviction filings) needs no key.
// Supabase supplies SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY automatically.
//
// Caller authentication: POST with header `x-refresh-token`. The expected token
// lives only in Supabase Vault (`explorer_refresh_token`); this function asks
// the database to verify it (public.explorer_refresh_token_valid, service role
// only) and never sees or returns the stored value.
//
// Body `{"dryRun": true}` fetches and computes without recording anything.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { runExplorerRefresh } from '../_shared/explorer-refresh.mjs'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) return json({ error: 'Refresh is not configured' }, 500)

  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const provided = request.headers.get('x-refresh-token') ?? ''
  const { data: authorized, error: authError } = await client.rpc(
    'explorer_refresh_token_valid',
    { p_token: provided },
  )
  if (authError) return json({ error: 'Refresh is not configured' }, 500)
  if (authorized !== true) return json({ error: 'Unauthorized' }, 401)

  const apiKeys = {
    fred: Deno.env.get('FRED_API_KEY') ?? '',
    eia: Deno.env.get('EIA_API_KEY') ?? '',
    census: Deno.env.get('CENSUS_API_KEY') ?? '',
  }
  if (!apiKeys.fred && !apiKeys.eia && !apiKeys.census) {
    return json({ error: 'Refresh is not configured' }, 500)
  }

  let dryRun = false
  try {
    const body = await request.json()
    dryRun = body?.dryRun === true
  } catch {
    // An empty body is a normal, non-dry run.
  }

  try {
    const results = await runExplorerRefresh({
      client,
      apiKeys,
      fetchImpl: fetch,
      dryRun,
    })
    const failed = results.filter((r: { outcome: string }) => r.outcome === 'error')
    return json({ dryRun, results }, failed.length === results.length && results.length > 0 ? 502 : 200)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Refresh failed' }, 500)
  }
})
