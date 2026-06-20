import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { Navigate } from 'react-router-dom'
import { loginRequest } from '../lib/msalConfig'

export default function Login() {
  const { instance } = useMsal()
  const isAuthenticated = useIsAuthenticated()

  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="text-6xl mb-4">👋</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Hello Work</h1>
        <p className="text-gray-500 mb-8">
          La piattaforma di corporate networking per connettere colleghi, competenze e persone.
        </p>
        <button
          onClick={() => void instance.loginRedirect(loginRequest)}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-3"
        >
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
            <path d="M1 1h9v9H1V1zm10 0h9v9h-9V1zM1 11h9v9H1v-9zm10 0h9v9h-9v-9z" fill="currentColor"/>
          </svg>
          Accedi con Microsoft
        </button>
        <p className="text-xs text-gray-400 mt-6">
          Accesso riservato ai dipendenti dell'organizzazione via Azure AD SSO
        </p>
      </div>
    </div>
  )
}
