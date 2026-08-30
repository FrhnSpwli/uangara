import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app/App'
import { registerServiceWorker } from './app/pwa/register-service-worker'
import './styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error(
    'Uangara could not start because the root element is missing.',
  )
}

registerServiceWorker()

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
