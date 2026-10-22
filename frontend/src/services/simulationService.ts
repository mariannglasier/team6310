import type { SimulationSnapshot } from '../types/domain'

// Contract scaffold only: resolve RPC names/DTOs and runtime validation when
// implementing protected backend operations. Never accept a client balance.
export interface SimulationService {
  restore(): Promise<SimulationSnapshot | null>
  start(input: {
    personaId: string
    supportEnabled: boolean
  }): Promise<SimulationSnapshot>
  submit(input: {
    runId: string
    versionId: string
    scenarioId: string
    choiceId: string
    requestId: string
  }): Promise<SimulationSnapshot>
}
export class ServiceUnavailableError extends Error {
  constructor() {
    super('Simulation backend is not connected yet.')
    this.name = 'ServiceUnavailableError'
  }
}
async function unavailable(): Promise<never> {
  throw new ServiceUnavailableError()
}
export const simulationService: SimulationService = {
  restore: unavailable,
  start: unavailable,
  submit: unavailable,
}
