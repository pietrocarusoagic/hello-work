import { Link, useLocation } from 'react-router-dom'
import { Home, User, Heart, Users, MapPin } from 'lucide-react'
import { useMsal } from '@azure/msal-react'
import { DEV_BYPASS } from '../lib/devBypass'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/workmatch', label: 'WorkMatch', icon: Heart },
  { to: '/groups', label: 'Gruppi', icon: Users },
  { to: '/map', label: 'Mappa', icon: MapPin },
  { to: '/profile', label: 'Profilo', icon: User },
]

export default function NavBar() {
  const location = useLocation()
  const { instance } = useMsal()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-agic-card border-t border-agic-border z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <span className="hidden md:flex items-center gap-2 text-xl font-bold">
            <span className="text-gradient-agic">Hello Work</span>
          </span>
          {DEV_BYPASS && (
            <span className="hidden md:block text-xs px-2 py-0.5 bg-yellow-900/40 text-yellow-400 rounded-full font-medium border border-yellow-700/40">
              🛠 DEV MODE
            </span>
          )}
          <div className="flex space-x-1 md:space-x-2 w-full md:w-auto justify-around md:justify-end">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex flex-col md:flex-row items-center gap-1 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                    active
                      ? 'text-agic-primary bg-agic-primary/10'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </Link>
              )
            })}
            {!DEV_BYPASS && (
              <button
                onClick={() => void instance.logoutRedirect()}
                className="hidden md:block text-sm text-white/30 hover:text-white/60 px-3 py-2 transition-colors"
              >
                Esci
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
