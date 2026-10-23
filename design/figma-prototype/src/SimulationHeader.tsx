import { useContext, useId, useRef, useState } from "react"
import cacLogo from "./assets/cac-logo.png"
import { landingContent } from "./landingContent"
import HomeLink from "./HomeLink"

import { NavigationContext, type NavigationItem } from "./NavigationContext"

export default function SimulationHeader({
  onNavigate,
}: {
  contentId: string
  onNavigate?: (item: NavigationItem) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notice, setNotice] = useState<NavigationItem | null>(null)
  const navigationId = useId()
  const menuButton = useRef<HTMLButtonElement>(null)
  const navigation = useContext(NavigationContext)

  return (
    <>
      <header
        className="cac-header"
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            setMenuOpen(false)
            menuButton.current?.focus()
          }
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setMenuOpen(false)
        }}
      >
        <HomeLink
          className="cac-logo-link"
          onClick={() => {
            setMenuOpen(false)
          }}
        >
          <img src={cacLogo} alt="Community Assistance Center" />
        </HomeLink>
        <button
          ref={menuButton}
          type="button"
          className="cac-menu-button"
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={menuOpen}
          aria-controls={navigationId}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav
          id={navigationId}
          className={`cac-nav${menuOpen ? " is-open" : ""}`}
          aria-label="Main navigation"
        >
          {landingContent.navigation.map((label) => {
            const item = label as NavigationItem
            return (
              <button
                key={item}
                type="button"
                className={item === navigation?.activePage ? "is-active" : ""}
                aria-current={
                  item === navigation?.activePage ? "page" : undefined
                }
                onClick={() => {
                  setMenuOpen(false)
                  menuButton.current?.focus()
                  if (navigation) navigation.navigate(item)
                  else if (onNavigate) onNavigate(item)
                  else setNotice(item)
                }}
              >
                {item}
              </button>
            )
          })}
        </nav>
      </header>
      {notice && (
        <div className="cac-notice" role="status">
          <div>
            <strong>{notice}</strong>
            <p>This option is not available in this prototype.</p>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notice"
          >
            Close
          </button>
        </div>
      )}
    </>
  )
}
