import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { paths } from '../../app/paths'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Form, TextField } from '../../components/ui/FormFields'
import { PageSection } from '../../components/ui/PageSection'
import { StaffAuthError } from '../../services/staffAuth'
import { useStaffAuth } from '../../state/staffAuthContext'

export function AdminLoginPage() {
  const { state, signIn } = useStaffAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})
  const [formError, setFormError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  if (state.status === 'staff')
    return <Navigate to={paths.adminDashboard} replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const errors = {
      email: email.trim() ? undefined : 'Enter your work email.',
      password: password ? undefined : 'Enter your password.',
    }
    setFieldErrors(errors)
    setFormError(undefined)
    if (errors.email || errors.password) return
    setSubmitting(true)
    try {
      await signIn(email, password)
      // The route re-renders into the dashboard once staff access is confirmed.
    } catch (failure) {
      setPassword('')
      setFormError(
        failure instanceof StaffAuthError
          ? failure.message
          : 'Sign-in is unavailable right now. Please try again.',
      )
      setSubmitting(false)
    }
  }

  return (
    <PageSection title="Employee sign-in">
      <p>Sign in with your CAC work email to open the staff dashboard.</p>
      <Form onSubmit={submit} noValidate aria-label="Employee sign-in">
        {formError && (
          <p className="ui-field__error" role="alert">
            {formError}
          </p>
        )}
        <TextField
          label="Work email"
          type="email"
          name="email"
          autoComplete="username"
          inputMode="email"
          value={email}
          error={fieldErrors.email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          error={fieldErrors.password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button type="submit" loading={submitting}>
          {submitting ? 'Signing in…' : 'Sign In'}
        </Button>
        <ButtonLink to={paths.home} variant="text">
          Back to main site
        </ButtonLink>
      </Form>
    </PageSection>
  )
}
