import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './landing.css'
import { endGroupDocument, initializeGroupDocument, ownsOpenSession } from './groupSessionService'

// Initialize before App's first recovery read. The app exposes a retry if storage fails.
try {
  initializeGroupDocument()
} catch {
  // Group operations remain gated by initialization; individual play is available.
}
window.addEventListener('beforeunload', (event) => {
  try {
    if (!ownsOpenSession()) return
  } catch {
    // When storage is unavailable, warn rather than silently losing host ownership.
  }
  event.preventDefault()
  event.returnValue = ''
})
window.addEventListener('pagehide', () => {
  try {
    endGroupDocument()
  } catch {
    // A new document retries closure before any pending operation can recover.
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
