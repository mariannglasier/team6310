import { act, renderHook } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { useSimulation } from './useSimulation'
import { simulationService } from '../services/simulationService'

test('the default backend scaffold fails explicitly without fabricating a run', async () => {
  const { result } = renderHook(() => useSimulation())
  expect(result.current.state.status).toBe('idle')
  await act(() => result.current.restore())
  expect(result.current.state.status).toBe('error')
  expect(result.current.state.error).toBe(
    'Simulation backend is not connected yet.',
  )
  expect(result.current.state.snapshot).toBeNull()
  await expect(
    simulationService.start({ personaId: 'test', supportEnabled: false }),
  ).rejects.toThrow('not connected')
  await expect(
    simulationService.submit({
      runId: 'test',
      versionId: 'test',
      scenarioId: 'test',
      choiceId: 'test',
      requestId: 'test',
    }),
  ).rejects.toThrow('not connected')
})
test('restoration is explicit, supports no active run, and masks internal errors', async () => {
  const restore = vi
    .fn()
    .mockResolvedValueOnce(null)
    .mockRejectedValueOnce(new Error('Internal database detail'))
  const { result } = renderHook(() =>
    useSimulation({ ...simulationService, restore }),
  )
  expect(restore).not.toHaveBeenCalled()
  await act(() => result.current.restore())
  expect(result.current.state.status).toBe('ready')
  expect(result.current.state.snapshot).toBeNull()
  await act(() => result.current.restore())
  expect(result.current.state.error).toBe(
    'Unable to restore the simulation. Please retry.',
  )
})
