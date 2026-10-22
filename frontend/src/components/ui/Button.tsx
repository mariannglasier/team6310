import type { ComponentProps } from 'react'
import { Link, type LinkProps } from 'react-router'
import './ui.css'

type Variant = 'primary' | 'secondary' | 'text' | 'danger'
type Appearance = { variant?: Variant; fullWidth?: boolean }
function classes(variant: Variant, fullWidth: boolean, className = '') {
  return `ui-button ui-button--${variant}${fullWidth ? ' ui-button--full' : ''} ${className}`
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  className,
  type = 'button',
  loading = false,
  disabled,
  children,
  ...props
}: ComponentProps<'button'> & Appearance & { loading?: boolean }) {
  return (
    <button
      {...props}
      type={type}
      className={classes(variant, fullWidth, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {children}
    </button>
  )
}

// Navigation keeps native link semantics; disabled actions should use Button.
export function ButtonLink({
  variant = 'secondary',
  fullWidth = false,
  className,
  ...props
}: LinkProps & Appearance) {
  return <Link {...props} className={classes(variant, fullWidth, className)} />
}

export function ExternalButtonLink({
  variant = 'secondary',
  fullWidth = false,
  className,
  ...props
}: ComponentProps<'a'> & Appearance) {
  return <a {...props} className={classes(variant, fullWidth, className)} />
}
