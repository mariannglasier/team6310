import { PlaceholderPage } from '../../components/PlaceholderPage'

export function LearnPage() {
  return (
    <PlaceholderPage title="Learn About CAC">
      <p>
        Approved CAC information and the official information destination are
        pending. This page does not yet provide service information.
      </p>
    </PlaceholderPage>
  )
}
export function DonatePage() {
  return (
    <PlaceholderPage title="Donate">
      <p>
        The approved official donation destination is pending. No donations or
        payment details are collected here.
      </p>
    </PlaceholderPage>
  )
}
export function NotFoundPage() {
  return (
    <PlaceholderPage title="Page not found">
      <p>
        This address does not match an application page. Use the navigation to
        return to a known page.
      </p>
    </PlaceholderPage>
  )
}
