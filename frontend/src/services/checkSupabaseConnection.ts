import { getSupabaseClient } from './supabase'

// Explicit diagnostic only; never runs during normal application startup.
// Listing buckets is read-only and needs no application table or bucket.
export async function checkSupabaseConnection() {
  const client = await getSupabaseClient()
  const { error } = await client.storage.listBuckets()

  // Do not return bucket metadata, configuration, or raw server error messages.
  return error
    ? { ok: false, status: error.status != null ? String(error.status) : null }
    : { ok: true, status: '200' }
}
