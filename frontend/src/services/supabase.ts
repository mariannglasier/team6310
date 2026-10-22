// Lazy loading lets public placeholders run without credentials. Existing client
// validation still runs when an actual backend consumer requests the client.
export async function getSupabaseClient() {
  return (await import('../lib/supabaseClient')).supabase
}
