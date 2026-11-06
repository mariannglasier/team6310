import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { BalanceDisplay } from './BalanceDisplay'
import { usdCents } from '../../types/domain'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('animates a confirmed payday, exposes the exact committed balance, then dismisses the notification', () => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  const { rerender } = render(
    <BalanceDisplay balance={usdCents(20000)} income={usdCents(40000)} />,
  )
  rerender(
    <BalanceDisplay
      balance={usdCents(60000)}
      income={usdCents(40000)}
      incomeKey="run:10"
    />,
  )
  act(() => vi.advanceTimersByTime(100))
  expect(screen.getByLabelText('Current balance $600.00')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('+$400.00 received')
  expect(screen.queryByText('$600.00', { exact: true })).toBeNull()
  act(() => vi.advanceTimersByTime(950))
  expect(screen.getByText('$600.00', { exact: true })).toBeInTheDocument()
  act(() => vi.advanceTimersByTime(1500))
  expect(screen.queryByRole('status')).toBeNull()
  rerender(
    <BalanceDisplay
      balance={usdCents(60000)}
      income={usdCents(40000)}
      incomeKey="run:10"
    />,
  )
  act(() => vi.advanceTimersByTime(100))
  expect(screen.queryByRole('status')).toBeNull()
})

it('respects reduced motion while retaining the received-income announcement', () => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  render(
    <BalanceDisplay
      balance={usdCents(60000)}
      income={usdCents(40000)}
      incomeKey="run:10"
    />,
  )
  act(() => vi.advanceTimersByTime(20))
  expect(screen.getByText('$600.00', { exact: true })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('+$400.00 received')
})
