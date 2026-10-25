import { getSupabaseClient } from './supabase'

export async function insertIntegrationTest(message: string): Promise<string> {
  if (!message.trim()) throw new Error('Enter a test message.')
  const client = await getSupabaseClient()
  // Revalidate at submission; never silently replace a missing participant.
  const { data: identity, error: authError } = await client.auth.getUser()
  if (authError || !identity.user?.id || identity.user.is_anonymous !== true) {
    throw new Error(
      'An anonymous participant session is required. Prepare the session again.',
    )
  }
  const { data, error } = await client
    .from('integration_test')
    .insert({ owner_id: identity.user.id, message: message.trim() })
    .select('id')
    .single()
  if (error || !data?.id) {
    throw new Error(
      'Insert failed. Check the development migration, session, and permissions before retrying.',
    )
  }
  return data.id
}
