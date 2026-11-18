import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { FieldInfo } from './FieldInfo'
import { Form, RequiredFieldLegend, TextField } from './FormFields'

test('field information opens from the keyboard, floats outside the form, and dismisses consistently', async () => {
  const user = userEvent.setup()
  const submit = vi.fn((e) => e.preventDefault())
  render(
    <Form onSubmit={submit}>
      <TextField
        label="Amount"
        labelAction={
          <FieldInfo
            label="Amount"
            text="Per occurrence, not a monthly total."
          />
        }
      />
      <button type="button">Elsewhere</button>
    </Form>,
  )
  const info = screen.getByRole('button', { name: 'About Amount' })
  expect(info).toHaveAttribute('aria-expanded', 'false')
  info.focus()
  await user.keyboard('{Enter}')
  const note = screen.getByRole('note', { name: 'About Amount' })
  expect(note).toHaveTextContent('not a monthly total')
  expect(note.closest('form')).toBeNull()
  expect(info).toHaveAttribute('aria-controls', note.id)
  expect(info).toHaveAccessibleDescription(
    'Per occurrence, not a monthly total.',
  )
  expect(submit).not.toHaveBeenCalled()
  await user.keyboard('{Escape}')
  expect(info).toHaveFocus()
  expect(screen.queryByRole('note')).toBeNull()
  await user.keyboard(' ')
  expect(screen.getByRole('note')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
  expect(screen.queryByRole('note')).toBeNull()
  await user.click(info)
  await user.tab()
  expect(screen.queryByRole('note')).toBeNull()
})
test('CMS required indicators keep accessible labels and native validation without changing unrelated forms', async () => {
  const user = userEvent.setup()
  render(
    <>
      <Form requiredIndicator="asterisk">
        <TextField label="CMS title" required />
        <RequiredFieldLegend />
      </Form>
      <Form>
        <TextField label="Other title" required />
      </Form>
    </>,
  )
  const field = screen.getByRole('textbox', { name: 'CMS title' })
  expect(field).toBeRequired()
  expect(field).not.toBeValid()
  expect(screen.getByText(/is a required field/)).toBeVisible()
  const marker = document.querySelector('label .ui-required-marker')
  expect(marker).toHaveAttribute('aria-hidden', 'true')
  expect(screen.getByLabelText('Other title (required)')).toBeRequired()
  await user.type(field, 'Authored title')
  expect(field).toBeValid()
})
