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
      {/* Desktop top bar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-agic-dark/95 backdrop-blur border-b border-gray-100 dark:border-agic-border transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-6 w-full flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight">
              <span className="gradient-text">Hello</span>
              <span className="text-gray-800 dark:text-white"> Work</span>
            </span>
            {DEV_BYPASS && (
              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full font-medium">
                DEV
              </span>
            )}
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-agic-secondary bg-agic-secondary/10'
                      : 'text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-agic-card'
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
                className="flex items-center gap-1.5 p-2 rounded-lg text-gray-500 dark:text-white/60 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-agic-card transition-colors text-sm"
              >
                <LogOut size={16} />
                <span>Esci</span>
              </button>
            )}
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
