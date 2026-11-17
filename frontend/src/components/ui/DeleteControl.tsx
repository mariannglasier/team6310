import type { ComponentProps } from 'react'
import './ui.css'

// A destructive action icon; callers own confirmation and deletion semantics.
export function DeleteControl({
  label,
  className = '',
  ...props
}: Omit<ComponentProps<'button'>, 'children' | 'type' | 'aria-label'> & {
  label: string
}) {
  return (
    <button
      {...props}
      type="button"
      aria-label={label}
      title={label}
      className={`ui-delete-control ${className}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M3 3l10 10M13 3L3 13"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}
