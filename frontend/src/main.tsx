import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig } from './lib/msalConfig'
import { ThemeProvider } from './lib/theme'
import App from './App'
import './index.css'

export const msalInstance = new PublicClientApplication(msalConfig)

async function bootstrap() {
  await msalInstance.initialize()

  const accounts = msalInstance.getAllAccounts()
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0])
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </MsalProvider>
    </StrictMode>,
  )
}

bootstrap().catch(console.error)
