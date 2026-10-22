import { createElement, useId, useState } from "react"
import cacLogo from "./assets/cac-logo.png"
import { landingContent } from "./landingContent"
import HomeLink from "./HomeLink"

export default function SimulationFooter() {
  const [notice, setNotice] = useState<"Privacy" | "Sources" | null>(null)
  const noticeId = useId()

  return (
    <>
      <footer className="cac-footer">
        <div className="cac-footer__brand">
          <HomeLink className="cac-footer-logo-link">
            <img src={cacLogo} alt="Community Assistance Center" />
          </HomeLink>
          <p>Helping neighbors in Sandy Springs and Dunwoody.</p>
        </div>
        <address className="cac-footer__contact">
          <p className="cac-footer__label">Contact CAC</p>
          {createElement(
            "a",
            { href: landingContent.contact.phoneHref },
            landingContent.contact.phone,
          )}
          {createElement(
            "a",
            { href: `mailto:${landingContent.contact.email}` },
            landingContent.contact.email,
          )}
        </address>
        <div className="cac-footer__links">
          <p className="cac-footer__label">Resources</p>
          {(["Privacy", "Sources"] as const).map((label) =>
            createElement(
              "a",
              {
                key: label,
                href: `#${noticeId}`,
                onClick: (event) => {
                  event.preventDefault()
                  setNotice(label)
                },
              },
              label,
            ),
          )}
        </div>
        <p className="cac-footer__tax">{landingContent.contact.taxId}</p>
      </footer>
      {notice && (
        <div
          id={noticeId}
          className="cac-notice cac-footer-notice"
          role="status"
        >
          <p>
            <strong>{notice} option</strong> is ready for its destination to be
            connected. No URL was supplied for this prototype.
          </p>
          {createElement(
            "button",
            {
              type: "button",
              onClick: () => setNotice(null),
              "aria-label": "Dismiss message",
            },
            "Dismiss",
          )}
        </div>
      )}
    </>
  )
}
