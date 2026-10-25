import { beforeEach, expect, it, vi } from 'vitest'
import { checkSupabaseConnection } from './checkSupabaseConnection'

const { listBuckets, getSupabaseClient } = vi.hoisted(() => ({
  listBuckets: vi.fn(),
  getSupabaseClient: vi.fn(),
}))

vi.mock('./supabase', () => ({ getSupabaseClient }))

beforeEach(() => {
  vi.resetAllMocks()
  getSupabaseClient.mockResolvedValue({ storage: { listBuckets } })
})

it('reports success without returning bucket metadata', async () => {
  listBuckets.mockResolvedValue({ data: [{ name: 'private' }], error: null })
  expect(await checkSupabaseConnection()).toEqual({ ok: true, status: '200' })
  expect(listBuckets).toHaveBeenCalledExactlyOnceWith()
})

it('returns only the status on access rejection', async () => {
  listBuckets.mockResolvedValue({
    error: { status: 403, statusCode: 'AccessDenied', message: 'raw' },
  })
  expect(await checkSupabaseConnection()).toEqual({ ok: false, status: '403' })
})

it('reports an unavailable HTTP status on transport failure', async () => {
  listBuckets.mockResolvedValue({ error: { message: 'raw' } })
  expect(await checkSupabaseConnection()).toEqual({ ok: false, status: null })
})

it('preserves configuration rejection without making a request', async () => {
  getSupabaseClient.mockRejectedValue(new Error('Missing configuration'))
  await expect(checkSupabaseConnection()).rejects.toThrow(
    'Missing configuration',
  )
  expect(listBuckets).not.toHaveBeenCalled()
})
