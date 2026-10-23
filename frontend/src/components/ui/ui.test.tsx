import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterAll, beforeAll, expect, test, vi } from 'vitest'
import { Button, ButtonLink } from './Button'
import { Form, SelectField, TextAreaField, TextField } from './FormFields'
import { RadioGroup } from './RadioGroup'
import { SetupProgress } from './SetupProgress'
import { Dialog } from './Dialog'

test('buttons default to non-submitting actions and respect disabled/loading states', async () => {
  const user = userEvent.setup()
  const submit = vi.fn((event) => event.preventDefault())
  const click = vi.fn()
  render(
    <Form onSubmit={submit}>
      <Button onClick={click}>Edit</Button>
      <Button disabled onClick={click}>
        Disabled
      </Button>
      <Button loading onClick={click}>
        Saving
      </Button>
      <Button type="submit">Submit</Button>
    </Form>,
  )
  await user.click(screen.getByRole('button', { name: 'Edit' }))
  expect(click).toHaveBeenCalledTimes(1)
  expect(submit).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Disabled' }))
  await user.click(screen.getByRole('button', { name: 'Saving' }))
  expect(click).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button', { name: 'Saving' })).toHaveAttribute(
    'aria-busy',
    'true',
  )
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  expect(submit).toHaveBeenCalledTimes(1)
})

test('navigation buttons retain link semantics', () => {
  render(
    <MemoryRouter>
      <ButtonLink to="/learn">Learn</ButtonLink>
    </MemoryRouter>,
  )
  expect(screen.getByRole('link', { name: 'Learn' })).toHaveAttribute(
    'href',
    '/learn',
  )
})

test('fields have unique labels, required semantics, linked hints/errors, and native input behavior', async () => {
  const user = userEvent.setup()
  render(
    <>
      <TextField
        label="Title"
        required
        hint="Use a short title"
        error="Title is required"
      />
      <TextField label="Title" />
      <TextAreaField label="Description" />
      <SelectField
        label="Category"
        hint="Choose a category"
        error="Select a category"
      >
        <option value="">Choose</option>
        <option value="food">Food</option>
      </SelectField>
    </>,
  )
  const [first, second] = screen.getAllByRole('textbox', { name: /Title/ })
  expect(first.id).not.toBe(second.id)
  expect(first).toBeRequired()
  expect(first).toHaveAttribute('aria-invalid', 'true')
  expect(first).toHaveAccessibleDescription(
    'Use a short title Title is required',
  )
  await user.type(second, 'Sample')
  expect(second).toHaveValue('Sample')
  await user.type(screen.getByLabelText('Description'), 'Details')
  expect(screen.getByLabelText('Description')).toHaveValue('Details')
  const select = screen.getByRole('combobox', { name: 'Category' })
  expect(select).toHaveAccessibleDescription(
    'Choose a category Select a category',
  )
  await user.selectOptions(select, 'food')
  expect(select).toHaveValue('food')
})

test('radio cards require an explicit choice and support arrow-key selection', async () => {
  const user = userEvent.setup()
  function Example() {
    const [value, setValue] = useState<string | null>(null)
    return (
      <RadioGroup
        label="Support"
        name="support"
        required
        value={value}
        onChange={setValue}
        options={[
          { value: 'with', label: 'With support' },
          { value: 'without', label: 'Without support' },
        ]}
      />
    )
  }
  render(<Example />)
  const radios = screen.getAllByRole('radio')
  radios.forEach((radio) => expect(radio).not.toBeChecked())
  await user.tab()
  await user.keyboard(' ')
  expect(radios[0]).toBeChecked()
  await user.keyboard('{ArrowRight}')
  expect(radios[1]).toBeChecked()
  expect(radios[0]).not.toBeChecked()
  expect(screen.getByText('Selected')).toBeInTheDocument()
})

test('disabled radio groups do not permit selection', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(
    <RadioGroup
      label="Support"
      name="support"
      disabled
      value={null}
      onChange={onChange}
      options={[{ value: 'with', label: 'With support' }]}
    />,
  )
  await user.click(screen.getByRole('radio'))
  expect(onChange).not.toHaveBeenCalled()
})

test('progress includes all four specified steps and identifies completed/current steps', () => {
  render(<SetupProgress step={3} />)
  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(4)
  expect(items[0]).toHaveTextContent('IntroductionCompleted')
  expect(items[1]).toHaveTextContent('HouseholdCompleted')
  expect(items[2]).toHaveAttribute('aria-current', 'step')
  expect(items[3]).toHaveTextContent('ReviewUpcoming')
})

// jsdom does not implement native modal lifecycle. These shims test our wiring;
// browser focus containment/inert behavior still requires browser verification.
const showDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
)
const closeDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close',
)
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute('open')
    },
  })
})
afterAll(() => {
  if (showDescriptor)
    Object.defineProperty(
      HTMLDialogElement.prototype,
      'showModal',
      showDescriptor,
    )
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (closeDescriptor)
    Object.defineProperty(HTMLDialogElement.prototype, 'close', closeDescriptor)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})
test('dialog has accessible content, closes on button/cancel, and restores trigger focus', async () => {
  const user = userEvent.setup()
  function Example() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Dialog
          open={open}
          title="Confirm action"
          description="Review before continuing."
          onDismiss={() => setOpen(false)}
        />
      </>
    )
  }
  render(<Example />)
  const trigger = screen.getByRole('button', { name: 'Open dialog' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await user.click(trigger)
  expect(
    screen.getByRole('dialog', { name: 'Confirm action' }),
  ).toHaveAccessibleDescription('Review before continuing.')
  expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  await user.click(screen.getByRole('button', { name: 'Close' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
  await user.click(trigger)
  fireEvent(
    screen.getByRole('dialog'),
    new Event('cancel', { bubbles: false, cancelable: true }),
  )
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})
