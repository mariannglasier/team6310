import { useState } from 'react'
import { PlaceholderPage } from '../../components/PlaceholderPage'
import { Button } from '../../components/ui/Button'
import {
  ensureParticipantSession,
  ParticipantSessionError,
} from '../../services/participantSession'

export function IndividualPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle',
  )
  const [message, setMessage] = useState('')
  async function prepareSession() {
    setStatus('loading')
    setMessage('Preparing participant session…')
    try {
      await ensureParticipantSession()
      setStatus('ready')
      setMessage(
        'Participant session is ready. No simulation run has been created.',
      )
    } catch (error) {
      setStatus('error')
      setMessage(
        error instanceof ParticipantSessionError
          ? error.message
          : 'Unable to prepare participant session. Please retry or contact the facilitator.',
      )
    }
  }
  return (
    <PlaceholderPage title="Individual simulation">
      <p>
        Household setup and individual gameplay are not implemented yet. Opening
        this page does not start a run.
      </p>
      <p>
        Prepare an anonymous participant session without entering credentials.
        This browser remembers the session; clearing browser storage can remove
        access to future saved progress. Use a separate browser profile for each
        participant sharing a device.
      </p>
      <Button
        onClick={prepareSession}
        loading={status === 'loading'}
        disabled={status === 'ready'}
      >
        Prepare participant session
      </Button>
      <p role={status === 'error' ? 'alert' : 'status'}>{message}</p>
    </PlaceholderPage>
  )
}
export function ResultsPage() {
  return (
    <PlaceholderPage title="Simulation results">
      <p>
        No run results are loaded. Results and summaries will be implemented in
        a later story.
      </p>
    </PlaceholderPage>
  )
}
