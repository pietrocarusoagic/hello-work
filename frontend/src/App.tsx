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
import DebugLogin, { DebugLoginSelector } from './pages/DebugLogin'
import NavBar from './components/NavBar'
import { api } from './lib/api'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const msalAuth = useIsAuthenticated()
  const isAuthenticated = DEV_BYPASS || msalAuth
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const msalAuth = useIsAuthenticated()
  const isAuthenticated = DEV_BYPASS || msalAuth
  const [bootstrapping, setBootstrapping] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setBootstrapping(false)
      return
    }
    let active = true
    setBootstrapping(true)
    api.post('/auth/me', {})
      .catch(console.error)
      .finally(() => { if (active) setBootstrapping(false) })
    return () => { active = false }
  }, [isAuthenticated])

  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-agic-dark">
        <div className="text-gray-400 dark:text-white/40 text-sm font-inter">Inizializzazione profilo…</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      {isAuthenticated && <NavBar />}
      <Routes>
        <Route path="/login" element={DEV_BYPASS ? <Navigate to="/" replace /> : <Login />} />
        {DEV_BYPASS && (
          <>
            <Route path="/debug/login" element={<DebugLoginSelector />} />
            <Route path="/debug/login/existing" element={<DebugLogin userType="existing" />} />
            <Route path="/debug/login/new" element={<DebugLogin userType="new" />} />
          </>
        )}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
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
