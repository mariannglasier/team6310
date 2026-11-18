import { useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './ui.css'

/** Non-modal, floating field help. Native buttons support Enter/Space; Escape,
 * outside pointer/focus and a second click dismiss without changing form state. */
export function FieldInfo({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const [position, setPosition] = useState<{
    left: number
    top: number
  } | null>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      if (!button.current || !panel.current) return
      const anchor = button.current.getBoundingClientRect()
      const popup = panel.current.getBoundingClientRect()
      const left = Math.max(
        12,
        Math.min(anchor.left, innerWidth - popup.width - 12),
      )
      const above = anchor.top - popup.height - 8
      const top = Math.max(
        12,
        above >= 12
          ? above
          : Math.min(anchor.bottom + 8, innerHeight - popup.height - 12),
      )
      setPosition({ left, top })
    }
    const outside = (event: Event) => {
      if (
        event.target instanceof Node &&
        !button.current?.contains(event.target) &&
        !panel.current?.contains(event.target)
      )
        setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
        button.current?.focus()
      }
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', outside)
    document.addEventListener('keydown', escape, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('focusin', outside)
      document.removeEventListener('keydown', escape, true)
    }
  }, [open])
  return (
    <>
      <button
        type="button"
        ref={button}
        className="ui-field-info"
        aria-label={`About ${label}`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-describedby={open ? id : undefined}
        onClick={(event) => {
          setPortalTarget(
            event.currentTarget.closest('dialog') ?? document.body,
          )
          setPosition(null)
          setOpen(!open)
        }}
      >
        <span aria-hidden="true">ⓘ</span>
      </button>
      {open &&
        portalTarget &&
        createPortal(
          <div
            ref={panel}
            id={id}
            role="note"
            aria-label={`About ${label}`}
            className="ui-field-info-content"
            style={{
              left: position?.left ?? 12,
              top: position?.top ?? 12,
              visibility: position ? 'visible' : 'hidden',
            }}
          >
            {text}
          </div>,
          portalTarget,
        )}
    </>
  )
}
