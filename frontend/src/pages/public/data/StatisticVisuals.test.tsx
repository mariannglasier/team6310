import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import type { ExplorerStatistic } from '../../../services/explorerService'
import {
  LiveStatistics,
  PercentMeter,
  PercentPictogram,
  StatisticCard,
} from './StatisticVisuals'

function statistic(
  overrides: Partial<ExplorerStatistic> = {},
): ExplorerStatistic {
  return {
    key: 'test',
    title: 'Households that skipped meals',
    description: 'Share of households that skipped meals to save money.',
    contextNote: null,
    value: 50,
    valueHigh: null,
    unit: 'percent',
    geography: 'Test area',
    geographyCode: null,
    periodLabel: '2024',
    sourceName: 'Test Source',
    sourceTitle: 'Test Survey',
    sourceUrl: 'https://example.org/survey',
    lastCheckedAt: null,
    visualization: 'pictogram',
    visualizationConfig: {
      icon: 'grocery_item',
      total: 10,
      container: 'grocery_bag',
    },
    isDerived: false,
    derivationNote: null,
    displayOrder: 1,
    ...overrides,
  }
}

function iconStates(container: HTMLElement): number[] {
  // Width of each icon's visible fill, as a share of the icon (24 units wide).
  return [...container.querySelectorAll('.pictogram__icon')].map((icon) => {
    const rect = icon.querySelector('clipPath rect')
    const hasFill = icon.querySelector('.pictogram__fill') !== null
    return hasFill ? Number(rect?.getAttribute('width')) / 24 : 0
  })
}

describe('PercentPictogram', () => {
  test('a dense count of 100 fills whole icons for whole percents and a part icon for the rest', () => {
    const { container } = render(
      <PercentPictogram
        percent={3.8}
        total={100}
        icon="person"
        dense
        valueText="3.8%"
      />,
    )
    expect(container.querySelector('.pictogram--dense')).not.toBeNull()
    const states = iconStates(container)
    expect(states).toHaveLength(100)
    expect(states.slice(0, 3)).toEqual([1, 1, 1])
    expect(states[3]).toBeCloseTo(0.8, 2)
    expect(states.slice(4).every((fill) => fill === 0)).toBe(true)
    expect(screen.getByRole('img')).toHaveAccessibleName(
      '3.8% shown as 3.8 of 100 icons filled',
    )
  })

  test('0% draws ten empty outlines and says so in text', () => {
    const { container } = render(
      <PercentPictogram
        percent={0}
        total={10}
        icon="grocery_item"
        valueText="0.0%"
      />,
    )
    expect(iconStates(container)).toEqual(Array(10).fill(0))
    expect(screen.getByRole('img')).toHaveAccessibleName(
      '0.0% shown as 0 of 10 icons filled',
    )
  })

  test('50% fills exactly five of ten icons', () => {
    const { container } = render(
      <PercentPictogram
        percent={50}
        total={10}
        icon="grocery_item"
        valueText="50.0%"
      />,
    )
    expect(iconStates(container)).toEqual([1, 1, 1, 1, 1, 0, 0, 0, 0, 0])
    expect(screen.getByRole('img')).toHaveAccessibleName(
      '50.0% shown as 5 of 10 icons filled',
    )
  })

  test('100% fills every icon', () => {
    const { container } = render(
      <PercentPictogram
        percent={100}
        total={10}
        icon="school_item"
        valueText="100.0%"
      />,
    )
    expect(iconStates(container)).toEqual(Array(10).fill(1))
  })

  test('13.5% of 20 icons fills 2.7 icons, with the last one cut part-way', () => {
    const { container } = render(
      <PercentPictogram
        percent={13.5}
        total={20}
        icon="person"
        valueText="13.5%"
      />,
    )
    const states = iconStates(container)
    expect(states.slice(0, 2)).toEqual([1, 1])
    expect(states[2]).toBeCloseTo(0.7, 3)
    expect(states.slice(3).every((state) => state === 0)).toBe(true)
    expect(screen.getByRole('img')).toHaveAccessibleName(
      '13.5% shown as 2.7 of 20 icons filled',
    )
  })

  test('unknown icon names fall back to a plain dot, and the container is recorded', () => {
    const { container } = render(
      <PercentPictogram
        percent={50}
        total={4}
        icon="mystery"
        container="backpack"
        valueText="50.0%"
      />,
    )
    expect(container.querySelectorAll('.pictogram__icon')).toHaveLength(4)
    expect(container.querySelector('.pictogram')).toHaveAttribute(
      'data-container',
      'backpack',
    )
  })

  test('an out-of-range percentage fails loudly instead of drawing a wrong picture', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(
        <PercentPictogram
          percent={140}
          total={10}
          icon="dot"
          valueText="140%"
        />,
      ),
    ).toThrow(RangeError)
    spy.mockRestore()
  })
})

describe('PercentMeter', () => {
  test('exposes the value to assistive technology with 0% and 100% ends in text', () => {
    render(
      <PercentMeter percent={37} label="Cannot cover $400" valueText="37.0%" />,
    )
    const meter = screen.getByRole('meter', { name: 'Cannot cover $400' })
    expect(meter).toHaveAttribute('aria-valuenow', '37')
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', '100')
    expect(meter).toHaveAttribute('aria-valuetext', '37.0%')
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  test('clamps the drawn width to the 0 to 100 range', () => {
    const { container } = render(
      <PercentMeter percent={0} label="x" valueText="0.0%" />,
    )
    expect(container.querySelector('span')).toHaveStyle({ width: '0%' })
    const high = render(
      <PercentMeter percent={100} label="y" valueText="100.0%" />,
    )
    expect(high.container.querySelector('span')).toHaveStyle({ width: '100%' })
  })
})

describe('StatisticCard', () => {
  test('shows the exact value, what it measures, place, period, and source as text', () => {
    render(
      <ul>
        <StatisticCard statistic={statistic({ value: 13.5 })} />
      </ul>,
    )
    const card = screen.getByRole('listitem')
    expect(
      within(card).getByRole('heading', {
        level: 4,
        name: 'Households that skipped meals',
      }),
    ).toBeInTheDocument()
    expect(
      within(card).getByText('13.5%', { selector: 'strong' }),
    ).toBeInTheDocument()
    expect(
      within(card).getByText(
        'Share of households that skipped meals to save money.',
      ),
    ).toBeInTheDocument()
    expect(within(card).getByText(/Test area · 2024/)).toBeInTheDocument()
    const link = within(card).getByRole('link', { name: /Test Source/ })
    expect(link).toHaveAttribute('href', 'https://example.org/survey')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  test('a pictogram statistic draws icons and keeps the exact value in text', () => {
    const { container } = render(
      <ul>
        <StatisticCard statistic={statistic({ value: 50 })} />
      </ul>,
    )
    expect(container.querySelectorAll('.pictogram__icon')).toHaveLength(10)
    expect(
      screen.getByText('50.0%', { selector: 'strong' }),
    ).toBeInTheDocument()
  })

  test('a meter statistic draws a meter', () => {
    render(
      <ul>
        <StatisticCard
          statistic={statistic({ visualization: 'meter', value: 37 })}
        />
      </ul>,
    )
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '37')
  })

  test('a pictogram with an unusable icon count falls back to a meter', () => {
    render(
      <ul>
        <StatisticCard
          statistic={statistic({
            visualizationConfig: { icon: 'dot', total: 'many' },
          })}
        />
      </ul>,
    )
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  test('values that are not a share of a whole get no proportion visual', () => {
    const { container } = render(
      <ul>
        <StatisticCard
          statistic={statistic({
            unit: 'percent_change',
            value: 3.6307,
            visualization: 'figure',
            visualizationConfig: {},
          })}
        />
      </ul>,
    )
    expect(
      screen.getByText('+3.6%', { selector: 'strong' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('meter')).toBeNull()
    expect(container.querySelector('.pictogram')).toBeNull()
  })

  test('a range is shown as a range, never drawn as a single point', () => {
    const { container } = render(
      <ul>
        <StatisticCard
          statistic={statistic({
            unit: 'count',
            value: 1600,
            valueHigh: 2000,
            visualization: 'pictogram',
          })}
        />
      </ul>,
    )
    expect(
      screen.getByText('1,600–2,000', { selector: 'strong' }),
    ).toBeInTheDocument()
    expect(container.querySelector('.pictogram')).toBeNull()
  })

  test('derived statistics explain the calculation; context and check date are shown', () => {
    render(
      <ul>
        <StatisticCard
          statistic={statistic({
            unit: 'percent_change',
            visualization: 'figure',
            isDerived: true,
            derivationNote: 'Latest divided by the prior year.',
            contextNote: 'Not the price of any one item.',
            lastCheckedAt: '2026-11-17T21:00:00+00:00',
          })}
        />
      </ul>,
    )
    expect(screen.getByText(/How it is calculated:/)).toBeInTheDocument()
    expect(
      screen.getByText(/Latest divided by the prior year\./),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Not the price of any one item.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Last checked November 17, 2026/),
    ).toBeInTheDocument()
  })
})

describe('LiveStatistics', () => {
  test('shows loading, then the published statistics', async () => {
    const load = vi.fn().mockResolvedValue([statistic()])
    render(<LiveStatistics categoryKey="food" load={load} />)
    expect(
      screen.getByText(/Loading the latest published statistics/),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: 'Latest published statistics',
      }),
    ).toBeInTheDocument()
    expect(load).toHaveBeenCalledWith('food')
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  test('renders nothing when no statistic is published', async () => {
    const load = vi.fn().mockResolvedValue([])
    const { container } = render(
      <LiveStatistics categoryKey="clothing" load={load} />,
    )
    await waitFor(() =>
      expect(screen.queryByText(/Loading the latest/)).toBeNull(),
    )
    expect(container).toBeEmptyDOMElement()
  })

  test('announces a load failure and Retry loads again', async () => {
    const user = userEvent.setup()
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce([statistic()])
    render(<LiveStatistics categoryKey="food" load={load} />)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(
      'Live statistics could not be loaded right now.',
    )
    await user.click(within(alert).getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { level: 3 })).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  test('a late response for a previous topic does not replace the current one', async () => {
    let resolveFirst: (value: readonly ExplorerStatistic[]) => void = () => {}
    const load = vi.fn((key: string) =>
      key === 'food'
        ? new Promise<readonly ExplorerStatistic[]>((resolve) => {
            resolveFirst = resolve
          })
        : Promise.resolve([
            statistic({ key: 'b', title: 'Housing statistic' }),
          ]),
    )
    const { rerender } = render(
      <LiveStatistics key="food" categoryKey="food" load={load} />,
    )
    rerender(<LiveStatistics key="housing" categoryKey="housing" load={load} />)
    expect(await screen.findByText('Housing statistic')).toBeInTheDocument()
    resolveFirst([statistic({ key: 'a', title: 'Food statistic' })])
    await Promise.resolve()
    expect(screen.queryByText('Food statistic')).toBeNull()
    expect(screen.getByText('Housing statistic')).toBeInTheDocument()
  })
})
