import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { formatUsd } from '../../lib/money'
import type { Persona } from '../../types/domain'
import { avatarTone } from './avatars'
import { splitDescription } from './householdText'
import { PersonaAvatar } from './PersonaAvatar'
import './household.css'

type Position = 'center' | 'previous' | 'next' | 'hidden'

function positionOf(index: number, active: number, total: number): Position {
  const offset = (index - active + total) % total
  if (offset === 0) return 'center'
  if (offset === 1) return 'next'
  if (offset === total - 1) return 'previous'
  return 'hidden'
}

// Temporary UI selection only: choosing a household changes no finances and
// creates no run. No household is selected by default.
export function HouseholdCarousel({
  personas,
  selectedId,
  onSelect,
}: {
  personas: readonly Persona[]
  selectedId: string | null
  onSelect: (personaId: string) => void
}) {
  const total = personas.length
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      personas.findIndex((persona) => persona.id === selectedId),
    ),
  )
  const radios = useRef<(HTMLInputElement | null)[]>([])
  const refocus = useRef(false)
  const touchStart = useRef<number | null>(null)

  useEffect(() => {
    // A moved slide disables the previously focused radio; keep keyboard focus.
    if (refocus.current) {
      refocus.current = false
      radios.current[active]?.focus()
    }
  }, [active])

  if (total === 0) return <p>No approved households are available yet.</p>
  const show = (index: number) => setActive((index + total) % total)

  function onKeyDown(event: KeyboardEvent<HTMLFieldSetElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    refocus.current = event.target instanceof HTMLInputElement
    show(active + (event.key === 'ArrowRight' ? 1 : -1))
  }

  return (
    <fieldset
      className="household-carousel"
      aria-roledescription="carousel"
      onKeyDown={onKeyDown}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current
        touchStart.current = null
        const end = event.changedTouches[0]?.clientX
        if (start === null || end === undefined || Math.abs(end - start) < 48)
          return
        show(active + (end < start ? 1 : -1))
      }}
    >
      <legend className="sr-only">Choose a household</legend>
      <div className="household-carousel__viewport">
        <div className="household-carousel__track">
          {personas.map((persona, index) => {
            const position = positionOf(index, active, total)
            const selected = selectedId === persona.id
            const { tagline, body } = splitDescription(
              persona.name,
              persona.description,
            )
            return (
              <div
                key={persona.id}
                className={`household-carousel__slide is-${position}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${total}: ${persona.name}`}
                aria-hidden={position === 'center' ? undefined : true}
              >
                <label
                  className={`household-card${selected ? ' is-selected' : ''}`}
                  onClick={(event) => {
                    if (position !== 'center') {
                      event.preventDefault()
                      show(index)
                    }
                  }}
                >
                  <input
                    ref={(node) => {
                      radios.current[index] = node
                    }}
                    type="radio"
                    name="household"
                    value={persona.id}
                    checked={selected}
                    disabled={position !== 'center'}
                    onChange={() => onSelect(persona.id)}
                  />
                  <span
                    className={`household-photo household-photo--${avatarTone(persona.name)}`}
                  >
                    <PersonaAvatar name={persona.name} />
                  </span>
                  <span className="household-card__content">
                    <strong className="household-name">{persona.name}</strong>
                    {tagline && (
                      <span className="household-tagline">{tagline}</span>
                    )}
                    <span className="household-detail">
                      Starting money <b>{formatUsd(persona.startingBalance)}</b>
                    </span>
                    <span className="household-bio">{body}</span>
                    <span className="household-choice">
                      {selected && (
                        <svg
                          className="household-choice__check"
                          aria-hidden="true"
                          viewBox="0 0 20 20"
                        >
                          <path d="m4 10 4 4 8-8" />
                        </svg>
                      )}
                      {selected ? 'Selected' : 'Choose this household'}
                    </span>
                  </span>
                </label>
              </div>
            )
          })}
        </div>
      </div>
      <div className="household-carousel__controls">
        <button
          type="button"
          className="household-carousel__arrow household-carousel__arrow--previous"
          onClick={() => show(active - 1)}
          aria-label="Show previous household"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div className="household-carousel__dots">
          {personas.map((persona, index) => (
            <button
              key={persona.id}
              type="button"
              className={`household-carousel__dot${index === active ? ' is-active' : ''}`}
              onClick={() => show(index)}
              aria-label={`Show ${persona.name}`}
              aria-current={index === active ? 'true' : undefined}
            />
          ))}
        </div>
        <button
          type="button"
          className="household-carousel__arrow household-carousel__arrow--next"
          onClick={() => show(active + 1)}
          aria-label="Show next household"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <span className="sr-only" aria-live="polite">
        {personas[active].name}, household {active + 1} of {total}
      </span>
    </fieldset>
  )
}
