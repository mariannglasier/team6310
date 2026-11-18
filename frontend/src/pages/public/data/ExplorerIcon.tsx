import type { CategoryId } from './dataExplorerContent'

export type IconKind = CategoryId | 'check' | 'sun' | 'snow' | 'arrow'

export function ExplorerIcon({
  kind,
  size = 22,
}: {
  kind: IconKind
  size?: number
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {kind === 'housing' && (
        <>
          <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
          <path d="M9 21v-8h6v8" />
        </>
      )}
      {kind === 'food' && (
        <>
          <path d="M3 9h18l-2 11H5Z" />
          <path d="m8 9 3-5M16 9l-3-5" />
        </>
      )}
      {kind === 'employment' && (
        <>
          <path d="M3 8h18v12H3Z" />
          <path d="M9 8V5h6v3M3 13h18" />
        </>
      )}
      {kind === 'clothing' && (
        <path d="M8 3 2 6l2 4 3-1v12h10V9l3 1 2-4-6-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3Z" />
      )}
      {kind === 'youth' && (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M17 14c2.8 0 5 2.2 5 5" />
        </>
      )}
      {kind === 'finances' && (
        <>
          <ellipse cx="12" cy="6" rx="7" ry="3" />
          <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
          <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
        </>
      )}
      {kind === 'check' && <path d="m5 12 5 5 9-10" />}
      {kind === 'arrow' && <path d="M5 12h14m-6-6 6 6-6 6" />}
      {kind === 'sun' && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
        </>
      )}
      {kind === 'snow' && (
        <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 2 3-2M9 20l3-2 3 2" />
      )}
    </svg>
  )
}
