import { beforeEach, expect, it, vi } from 'vitest'
import { insertIntegrationTest } from './integrationTest'

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
}))
vi.mock('./supabase', () => ({ getSupabaseClient: mocks.getSupabaseClient }))
beforeEach(() => {
  vi.resetAllMocks()
  mocks.getSupabaseClient.mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  })
  mocks.getUser.mockResolvedValue({
    data: { user: { id: 'participant-a', is_anonymous: true } },
    error: null,
  })
  mocks.from.mockReturnValue({ insert: mocks.insert })
  mocks.insert.mockReturnValue({ select: mocks.select })
  mocks.select.mockReturnValue({ single: mocks.single })
  mocks.single.mockResolvedValue({ data: { id: 'row-id' }, error: null })
})

it('uses the Auth-verified owner and returns a committed row ID', async () => {
  expect(await insertIntegrationTest(' test ')).toBe('row-id')
  expect(mocks.from).toHaveBeenCalledWith('integration_test')
  expect(mocks.insert).toHaveBeenCalledWith({
    owner_id: 'participant-a',
    message: 'test',
  })
  expect(mocks.select).toHaveBeenCalledWith('id')
})

it.each([
  { data: { user: null }, error: null },
  { data: { user: { id: 'staff', is_anonymous: false } }, error: null },
  { data: { user: { id: 'participant-a', is_anonymous: true } }, error: {} },
])(
  'rejects missing or invalid participant identity before inserting',
  async (result) => {
    mocks.getUser.mockResolvedValue(result)
    await expect(insertIntegrationTest('test')).rejects.toThrow(
      'anonymous participant',
    )
    expect(mocks.from).not.toHaveBeenCalled()
  },
)

it('rejects API failures and missing returned rows', async () => {
  mocks.single.mockResolvedValueOnce({
    data: null,
    error: { message: 'private error' },
  })
  await expect(insertIntegrationTest('test')).rejects.toThrow('Insert failed')
  mocks.single.mockResolvedValueOnce({ data: null, error: null })
  await expect(insertIntegrationTest('test')).rejects.toThrow('Insert failed')
})

it('rejects blank messages without loading the client', async () => {
  await expect(insertIntegrationTest('  ')).rejects.toThrow(
    'Enter a test message',
  )
  expect(mocks.getSupabaseClient).not.toHaveBeenCalled()
})
