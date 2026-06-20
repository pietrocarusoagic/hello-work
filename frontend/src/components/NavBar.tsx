import { Link, useLocation } from 'react-router-dom'
import { Home, User, Heart, Users, MapPin, Sun, Moon, LogOut } from 'lucide-react'
import { useMsal } from '@azure/msal-react'
import { DEV_BYPASS } from '../lib/devBypass'
import { useTheme } from '../lib/theme'

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
  const { theme, toggle } = useTheme()

  return (
    <>
    <nav className="hidden md:block fixed top-0 left-0 right-0 bg-agic-card border-b border-agic-border z-50">
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

          {/* Nav links */}
          <div className="flex items-center gap-1">
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
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Cambia tema"
              className="p-2 rounded-lg text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-agic-card transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {!DEV_BYPASS && (
              <button
                onClick={() => void instance.logoutRedirect()}
                className="hidden md:block text-sm text-white/30 hover:text-white/60 px-3 py-2 transition-colors"
              >
                <LogOut size={16} />
                <span>Esci</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-agic-card border-t border-gray-100 dark:border-agic-border transition-colors duration-200">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  active
                    ? 'text-agic-secondary'
                    : 'text-gray-400 dark:text-white/40'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span>{label}</span>
              </Link>
            )
          })}
          <button
            onClick={toggle}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 dark:text-white/40 transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} strokeWidth={1.8} /> : <Moon size={20} strokeWidth={1.8} />}
            <span>Tema</span>
          </button>
        </div>
      </nav>
    </>
  )
}
