import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { Navigate } from 'react-router-dom'
import { loginRequest } from '../lib/msalConfig'
import { useTheme } from '../lib/theme'
import { Sun, Moon } from 'lucide-react'

export default function Login() {
  const { instance } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const { theme, toggle } = useTheme()

  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-agic-dark flex items-center justify-center p-4">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl bg-agic-primary" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15 blur-3xl bg-agic-secondary" />
      </div>

      <div className="relative bg-agic-card border border-agic-border rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        {/* Logo area */}
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="text-gradient-agic">Hello Work</span>
          </h1>
          <div className="mt-1 text-xs font-semibold tracking-widest text-white/30 uppercase">
            by AGIC Technology
          </div>
        </div>

        <p className="text-white/60 text-sm mb-8 leading-relaxed">
          La piattaforma di corporate networking per connettere colleghi, competenze e persone.
        </p>

        <button
          onClick={() => void instance.loginRedirect(loginRequest)}
          className="w-full bg-gradient-agic hover:opacity-90 text-white font-semibold py-3 px-6 rounded-xl transition-opacity flex items-center justify-center gap-3 shadow-lg"
        >
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
            <path d="M1 1h9v9H1V1zm10 0h9v9h-9V1zM1 11h9v9H1v-9zm10 0h9v9h-9v-9z" fill="currentColor"/>
          </svg>
          Accedi con Microsoft
        </button>

        <p className="text-xs text-white/25 mt-6">
          Accesso riservato ai dipendenti dell'organizzazione via Azure AD SSO
        </p>
      </div>
    </div>
  )
}

