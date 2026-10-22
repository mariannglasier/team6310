import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from './Button'
import './ui.css'

interface DialogProps {
  open: boolean
  title: string
  description: string
  onDismiss: () => void
  children?: ReactNode
}
// Native modal dialogs provide focus containment and inert background content.
export function Dialog({
  open,
  title,
  description,
  onDismiss,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const dismissRef = useRef<HTMLButtonElement>(null)
  const id = useId()
  useEffect(() => {
    const dialog = ref.current
    if (!open || !dialog) return
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    dialog.showModal()
    dismissRef.current?.focus()
    return () => {
      if (dialog.open) dialog.close()
      if (trigger?.isConnected) trigger.focus()
    }
  }, [open])
  return (
    <dialog
      ref={ref}
      className="ui-dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault()
        onDismiss()
      }}
    >
      <h2 id={`${id}-title`}>{title}</h2>
      <p id={`${id}-description`}>{description}</p>
      {children}
      <div className="ui-dialog__actions">
        <Button ref={dismissRef} variant="secondary" onClick={onDismiss}>
          Close
        </Button>
      </div>
    </dialog>
  )
}
