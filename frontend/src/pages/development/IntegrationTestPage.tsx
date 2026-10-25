import { useState, type FormEvent } from 'react'
import { PageSection } from '../../components/ui/PageSection'
import { Button } from '../../components/ui/Button'
import { Form, TextField } from '../../components/ui/FormFields'
import { ensureParticipantSession } from '../../services/participantSession'
import { insertIntegrationTest } from '../../services/integrationTest'

export function IntegrationTestPage() {
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [feedback, setFeedback] = useState('')
  const [failed, setFailed] = useState(false)

  async function prepare() {
    setBusy(true)
    setFailed(false)
    setReady(false)
    setFeedback('Preparing participant session…')
    try {
      await ensureParticipantSession()
      setReady(true)
      setFeedback('Anonymous participant session ready.')
    } catch {
      setFailed(true)
      setFeedback(
        'Unable to prepare an anonymous participant session. Retry or contact the facilitator.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ready || busy || !message.trim()) return
    setBusy(true)
    setFailed(false)
    setFeedback('Inserting test row…')
    try {
      const id = await insertIntegrationTest(message)
      setFeedback(`Test row created successfully. Row ID: ${id}`)
    } catch {
      setReady(false)
      setFailed(true)
      setFeedback(
        'Insert could not be confirmed. Check the migration, session, and permissions. Check Table Editor before retrying to avoid duplicate test rows.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageSection title="Temporary Supabase integration test">
      <p>
        Development test only. Enter a fictional test message, never personal
        information.
      </p>
      <Button onClick={prepare} disabled={busy || ready}>
        Prepare participant session
      </Button>
      <Form onSubmit={submit}>
        <TextField
          label="Test message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          disabled={busy}
        />
        <Button
          type="submit"
          loading={busy}
          disabled={!ready || !message.trim()}
        >
          Insert test row
        </Button>
      </Form>
      <p role={failed ? 'alert' : 'status'}>{feedback}</p>
    </PageSection>
  )
}
