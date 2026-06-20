import { useEffect, useState } from 'react'
import { Sun, Moon, Zap, UserCheck, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import { DevUserType, setDevUserType } from '../lib/devBypass'
import { useTheme } from '../lib/theme'

// ─── dati delle due identità fittizie ────────────────────────────────────────

const USERS: Record<DevUserType, {
  label: string
  name: string
  role: string
  department: string
  email: string
  tags: string[]
  matches: { active: number; pending: number }
  description: string
  icon: typeof UserCheck
  accentClass: string
  badgeClass: string
}> = {
  existing: {
    label: 'Utente esistente',
    name: 'Giulia Rossi',
    role: 'Cloud Solution Architect',
    department: 'Modern Work',
    email: 'giulia.rossi@example.com',
    tags: ['Azure', 'TypeScript', 'Copilot'],
    matches: { active: 2, pending: 2 },
    description: 'Profilo completo con match attivi e notifiche pending.',
    icon: UserCheck,
    accentClass: 'from-agic-primary to-agic-secondary',
    badgeClass: 'bg-agic-primary/10 text-agic-primary dark:bg-agic-primary/20 dark:text-pink-300',
  },
  new: {
    label: 'Nuovo utente',
    name: 'Luca Ferrari',
    role: '—',
    department: '—',
    email: 'luca.ferrari@hellowork.local',
    tags: [],
    matches: { active: 0, pending: 0 },
    description: 'Primo accesso: nessun profilo, nessun match. Simula l\'onboarding.',
    icon: Sparkles,
    accentClass: 'from-violet-500 to-indigo-500',
    badgeClass: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300',
  },
}

// ─── schermata singola (redirect automatico) ─────────────────────────────────

export function DebugLoginRedirect({ userType }: { userType: DevUserType }) {
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDevUserType(userType)
    const t = setTimeout(() => {
      setDone(true)
      window.location.replace('/')
    }, 900)
    return () => clearTimeout(t)
  }, [userType])

  const user = USERS[userType]
  const Icon = user.icon

  return (
    <div className="min-h-screen bg-white dark:bg-agic-dark flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-agic-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-agic-secondary/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative bg-white dark:bg-agic-card border border-gray-100 dark:border-agic-border rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <DevBadge />

        <div className={`mx-auto mb-5 w-16 h-16 rounded-2xl bg-gradient-to-br ${user.accentClass} flex items-center justify-center shadow-lg`}>
          {done
            ? <CheckCircle2 size={28} className="text-white" />
            : <Icon size={28} className="text-white" />}
        </div>

        <p className="text-xs font-medium text-gray-400 dark:text-white/40 uppercase tracking-widest mb-1">
          {user.label}
        </p>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{user.name}</h2>
        <p className="text-sm text-gray-500 dark:text-white/50 mb-6">{user.description}</p>

        <div className="flex items-center justify-center gap-1.5 text-sm text-gray-400 dark:text-white/30">
          <span className={`inline-block w-2 h-2 rounded-full ${done ? 'bg-green-400' : 'bg-agic-primary animate-pulse'}`} />
          {done ? 'Accesso completato' : 'Accesso in corso…'}
        </div>
      </div>
    </div>
  )
}

// ─── selettore (schermata principale /debug/login) ───────────────────────────

export function DebugLoginSelector() {
  const { theme, toggle } = useTheme()

  function handleSelect(type: DevUserType) {
    setDevUserType(type)
    window.location.replace('/')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-agic-dark flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-agic-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-agic-secondary/20 rounded-full blur-3xl pointer-events-none" />

      {/* theme toggle */}
      <button
        onClick={toggle}
        aria-label="Cambia tema"
        className="absolute top-4 right-4 p-2.5 rounded-xl bg-gray-100 dark:bg-agic-card text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="relative w-full max-w-lg">
        {/* header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">H</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1">
            Hello<span className="gradient-text">Work</span>
          </h1>
          <DevBadge className="mt-3 inline-flex" />
          <p className="text-sm text-gray-500 dark:text-white/40 mt-3">
            Scegli un'identità fittizia per esplorare la piattaforma.
          </p>
        </div>

        {/* user cards */}
        <div className="space-y-3">
          {(Object.entries(USERS) as [DevUserType, typeof USERS.existing][]).map(([type, user]) => {
            const Icon = user.icon
            return (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                className="w-full text-left bg-white dark:bg-agic-card border border-gray-100 dark:border-agic-border rounded-2xl p-5 hover:border-agic-primary dark:hover:border-agic-primary hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex items-start gap-4">
                  {/* avatar */}
                  <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${user.accentClass} flex items-center justify-center shadow-md`}>
                    <Icon size={22} className="text-white" />
                  </div>

                  {/* info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-gray-900 dark:text-white">{user.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.badgeClass}`}>
                        {user.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-white/40 truncate mb-2">
                      {user.role !== '—' ? `${user.role} · ${user.department}` : 'Profilo da completare'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-white/50 leading-relaxed">
                      {user.description}
                    </p>

                    {/* tags + match stats */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {user.tags.map(t => (
                        <span key={t} className="text-xs bg-gray-100 dark:bg-agic-dark text-gray-500 dark:text-white/40 px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                      {user.matches.active + user.matches.pending > 0 && (
                        <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                          {user.matches.active} match attivi
                        </span>
                      )}
                      {user.matches.pending > 0 && (
                        <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                          {user.matches.pending} pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* arrow */}
                  <ArrowRight
                    size={18}
                    className="shrink-0 text-gray-300 dark:text-white/20 group-hover:text-agic-primary group-hover:translate-x-0.5 transition-all mt-1"
                  />
                </div>
              </button>
            )
          })}
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-white/20 mt-6">
          Visibile solo in modalità <code className="font-mono">VITE_DEV_BYPASS=true</code>
        </p>
      </div>
    </div>
  )
}

// ─── badge DEV ───────────────────────────────────────────────────────────────

function DevBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 ${className}`}>
      <Zap size={11} />
      DEV MODE
    </span>
  )
}

// ─── export di default per retrocompatibilità (redirect diretto) ─────────────

export default DebugLoginRedirect
