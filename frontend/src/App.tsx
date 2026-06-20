import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useIsAuthenticated } from '@azure/msal-react'
import { DEV_BYPASS } from './lib/devBypass'
import Login from './pages/Login'
import Home from './pages/Home'
import Profile from './pages/Profile'
import WorkMatch from './pages/WorkMatch'
import Groups from './pages/Groups'
import Map from './pages/Map'
import OnboardingWizard from './pages/OnboardingWizard'
import NavBar from './components/NavBar'
import { api, UserProfile } from './lib/api'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const msalAuth = useIsAuthenticated()
  const isAuthenticated = DEV_BYPASS || msalAuth
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function needsOnboarding(profile: UserProfile): boolean {
  if (profile.profileScore < 30) return true
  return (
    profile.skills.length === 0 &&
    profile.aiTools.length === 0 &&
    profile.hobbies.length === 0
  )
}

export default function App() {
  const msalAuth = useIsAuthenticated()
  const isAuthenticated = DEV_BYPASS || msalAuth
  const [bootstrapping, setBootstrapping] = useState(false)
  const [redirectOnboarding, setRedirectOnboarding] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setBootstrapping(false)
      return
    }
    let active = true
    setBootstrapping(true)
    api.post('/auth/me', {})
      .then(() => api.get<UserProfile>('/profiles/me'))
      .then((profile) => {
        if (active && needsOnboarding(profile)) {
          setRedirectOnboarding(true)
        }
      })
      .catch(console.error)
      .finally(() => { if (active) setBootstrapping(false) })
    return () => { active = false }
  }, [isAuthenticated])

  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Inizializzazione profilo…
      </div>
    )
  }

  return (
    <BrowserRouter>
      {isAuthenticated && <NavBar />}
      <Routes>
        <Route path="/login" element={DEV_BYPASS ? <Navigate to="/" replace /> : <Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {redirectOnboarding ? <Navigate to="/onboarding" replace /> : <Home />}
            </ProtectedRoute>
          }
        />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/workmatch" element={<ProtectedRoute><WorkMatch /></ProtectedRoute>} />
        <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
