import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { setDebugUser, DebugUser } from '../lib/devBypass'

const USERS: Array<{
  type: DebugUser
  name: string
  role: string
  department: string
  badge: string
  badgeColor: string
  description: string
  pills: string[]
  scenario: string
}> = [
  {
    type: 'existing-user',
    name: 'Giulia Rossi',
    role: 'Cloud Solution Architect',
    department: 'Modern Work · Milano',
    badge: 'Utente esistente',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    description: 'Profilo completo con competenze, hobby e interessi già compilati.',
    pills: ['1 match attivo', '1 match in attesa', 'Membro di 2 gruppi'],
    scenario: 'Entra direttamente nella Home',
  },
  {
    type: 'new-user',
    name: 'Luca Verdi',
    role: 'Nuovo dipendente',
    department: 'Profilo non ancora configurato',
    badge: 'Primo accesso',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    description: 'Nessuna informazione di profilo: l\'app avvia il wizard di onboarding.',
    pills: ['Nessun match', 'Nessun gruppo', 'Score: 0'],
    scenario: 'Viene reindirizzato all\'onboarding',
  },
]

/** Quando c'è il param :userType → esegue il cambio e ricarica */
function SwitchUser({ userType }: { userType: string }) {
  useEffect(() => {
    const type: DebugUser = userType === 'new-user' ? 'new-user' : 'existing-user'
    setDebugUser(type)
    window.location.replace('/')
  }, [userType])

  return (
    <div className="min-h-screen flex items-center justify-center bg-agic-dark">
      <div className="text-white/40 text-sm font-inter animate-pulse">Cambio utente di debug…</div>
    </div>
  )
}

/** Schermata di selezione utente (mostrata su /login in DEV_BYPASS) */
function DebugSelector() {

  function selectUser(type: DebugUser) {
    setDebugUser(type)
    window.location.replace(type === 'new-user' ? '/onboarding' : '/')
  }

  return (
    <div className="min-h-screen bg-agic-dark flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl bg-agic-primary" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15 blur-3xl bg-agic-secondary" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="text-gradient-agic">Hello Work</span>
          </h1>
          <div className="mt-1 text-xs font-semibold tracking-widest text-white/30 uppercase">
            by AGIC Technology
          </div>
          <div className="mt-4 inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            Modalità sviluppo — seleziona un utente di test
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {USERS.map((u) => (
            <button
              key={u.type}
              onClick={() => selectUser(u.type)}
              className="group text-left bg-agic-card border border-agic-border hover:border-agic-primary/50 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:shadow-agic-primary/10 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-agic-primary/50"
            >
              {/* Avatar + badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-agic flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {u.name.charAt(0)}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${u.badgeColor}`}>
                  {u.badge}
                </span>
              </div>

              {/* Identity */}
              <div className="mb-3">
                <div className="text-white font-semibold text-base">{u.name}</div>
                <div className="text-white/50 text-xs mt-0.5">{u.role}</div>
                <div className="text-white/30 text-xs">{u.department}</div>
              </div>

              {/* Description */}
              <p className="text-white/50 text-xs leading-relaxed mb-4">{u.description}</p>

              {/* Pills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {u.pills.map((p) => (
                  <span key={p} className="text-xs bg-white/5 border border-white/10 text-white/40 px-2 py-0.5 rounded-full">
                    {p}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center justify-between">
                <span className="text-white/30 text-xs">{u.scenario}</span>
                <span className="text-agic-primary text-sm group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          Queste identità esistono solo in ambiente dev · non vengono mai usate in produzione
        </p>
      </div>
    </div>
  )
}

export default function DebugLogin() {
  const { userType } = useParams<{ userType?: string }>()
  return userType ? <SwitchUser userType={userType} /> : <DebugSelector />
}
