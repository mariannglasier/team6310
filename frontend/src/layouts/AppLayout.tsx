import { useEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Navigation } from '../components/ui/Navigation'
import { isStagePath, paths } from '../app/paths'
import { externalLinks } from '../app/externalLinks'
import cacLogo from '../assets/cac-logo.png'
import './AppLayout.css'

export function AppLayout() {
  const { pathname } = useLocation()
  const isLanding = pathname === paths.home
  // Every simulation page sits on the scenic stage between header and footer.
  const isStage = isStagePath(pathname)
  const previousPath = useRef(pathname)
  useEffect(() => {
    const heading = document.querySelector<HTMLHeadingElement>('#page-heading')
    document.title = `${heading?.textContent ?? 'Page'} | CAC Poverty Simulation`
    if (previousPath.current !== pathname) heading?.focus()
    previousPath.current = pathname
  }, [pathname])

  return (
    <div
      className={[
        'app-shell',
        isLanding && 'landing-shell',
        isStage && 'app-shell--stage',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="app-viewport">
        <header className="site-header">
          <Link
            className="site-title landing-brand"
            to={paths.home}
            aria-label="CAC Poverty Simulation"
          >
            <img
              src={cacLogo}
              width="128"
              height="64"
              alt="Community Assistance Center"
            />
          </Link>
          <Navigation
            label="Main navigation"
            items={[
              {
                to: externalLinks.learn,
                label: 'Learn About CAC',
                external: true,
              },
              { to: paths.data, label: 'Explore Data' },
              { to: externalLinks.donate, label: 'Donate', external: true },
            ]}
          />
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className={isStage ? 'stage' : undefined}
        >
          {isStage ? (
            <div className="stage__panel">
              <Outlet />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
      <footer className="site-footer landing-footer">
        <div className="landing-footer__brand">
          <Link to={paths.home} aria-label="Return to landing page">
            <img
              src={cacLogo}
              width="150"
              height="75"
              alt="Community Assistance Center"
            />
          </Link>
          <p>Helping neighbors in Sandy Springs and Dunwoody.</p>
        </div>
        <section aria-labelledby="footer-contact">
          <h2 id="footer-contact">Contact CAC</h2>
          <address>
            <a href="tel:+17705524889">(770) 552-4889</a>
            <a href="mailto:info@ourcac.org">info@ourcac.org</a>
          </address>
        </section>
        <section aria-labelledby="footer-resources">
          <h2 id="footer-resources">Resources</h2>
          <div className="landing-footer__resources">
            <span role="link" aria-disabled="true">
              Privacy <small>(coming soon)</small>
            </span>
            <span role="link" aria-disabled="true">
              Sources <small>(coming soon)</small>
            </span>
          </div>
        </section>
        <p className="landing-footer__tax">Tax ID #: 58-1825565</p>
      </footer>
    </div>
  )
}
