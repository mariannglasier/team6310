import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PriceUpdateStatus } from './PriceUpdateStatus'

const rpc = vi.fn()
vi.mock('../../services/supabase', () => ({
  getSupabaseClient: async () => ({ rpc }),
}))

describe('PriceUpdateStatus', () => {
  it('shows carried-forward values with the earlier verification date', async () => {
    rpc.mockResolvedValue({
      data: {
        checkedAt: '2026-12-26',
        items: [
          {
            label: 'Electricity',
            status: 'carried_forward',
            lastSuccessfulAt: '2026-11-17',
            observationPeriod: '2026-08',
          },
        ],
      },
      error: null,
    })
    render(<PriceUpdateStatus versionId="edition" />)
    const details = screen.getByText('Last updated').closest('details')!
    details.open = true
    fireEvent(details, new Event('toggle'))
    expect(
      await screen.findByText(/1 value carried forward/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Electricity — Carried forward; last verified/),
    ).toHaveTextContent(new Date('2026-11-17').toLocaleDateString())
    expect(rpc).toHaveBeenCalledWith('get_edition_price_updates', {
      p_version_id: 'edition',
    })
  })
  it('keeps the page usable when update information is unavailable', async () => {
    rpc.mockRejectedValue(new Error('Offline'))
    render(
      <>
        <PriceUpdateStatus versionId="edition" />
        <button>Continue</button>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
    const details = screen.getByText('Last updated').closest('details')!
    details.open = true
    fireEvent(details, new Event('toggle'))
    expect(
      await screen.findByText('Price update information is unavailable.'),
    ).toBeInTheDocument()
  })
})
