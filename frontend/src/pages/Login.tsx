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
    <div className="min-h-screen bg-white dark:bg-agic-dark flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Background gradient blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-agic-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-agic-secondary/20 rounded-full blur-3xl pointer-events-none" />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        aria-label="Cambia tema"
        className="absolute top-4 right-4 p-2.5 rounded-xl bg-gray-100 dark:bg-agic-card text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="relative bg-white dark:bg-agic-card border border-gray-100 dark:border-agic-border rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        {/* Logo mark */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-2xl">H</span>
          </div>
        </div>

        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
          Hello<span className="gradient-text">Work</span>
        </h1>
        <p className="text-gray-500 dark:text-white/50 text-sm mb-8 leading-relaxed">
          La piattaforma di corporate networking per connettere colleghi, competenze e persone.
        </p>

        <button
          onClick={() => void instance.loginRedirect(loginRequest)}
          className="w-full gradient-bg hover:opacity-90 text-white font-semibold py-3 px-6 rounded-xl transition-opacity flex items-center justify-center gap-3 shadow-lg"
        >
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
            <path d="M1 1h9v9H1V1zm10 0h9v9h-9V1zM1 11h9v9H1v-9zm10 0h9v9h-9v-9z" fill="currentColor"/>
          </svg>
          Accedi con Microsoft
        </button>

        <p className="text-xs text-gray-400 dark:text-white/30 mt-6">
          Accesso riservato ai dipendenti dell'organizzazione via Azure AD SSO
        </p>
      </div>
    </div>
  )
}

