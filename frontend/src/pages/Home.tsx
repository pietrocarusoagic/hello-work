import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { api, UserProfile, WorkMatchCard } from '../lib/api'
import { DEV_BYPASS, getDevMockAccount } from '../lib/devBypass'
import ProfileCompleteness from '../components/ProfileCompleteness'

export default function Home() {
  const { accounts } = useMsal()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [suggestions, setSuggestions] = useState<WorkMatchCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<UserProfile>('/profiles/me'),
      api.get<WorkMatchCard[]>('/matches/suggestions?limit=4'),
    ])
      .then(([p, s]) => { setProfile(p); setSuggestions(s) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const userName = DEV_BYPASS
    ? getDevMockAccount().name
    : (accounts[0]?.name ?? 'Collega')

  if (loading) {
    return (
      <div className="min-h-screen bg-agic-dark flex items-center justify-center">
        <div className="text-white/40 text-sm">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-agic-dark pb-20 md:pt-20 max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Ciao, {userName.split(' ')[0]} 👋</h1>
        <p className="text-white/50 text-sm mt-1">Scopri i tuoi colleghi</p>
      </div>

      {profile && <div className="mb-6"><ProfileCompleteness score={profile.profileScore} /></div>}

      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          { to: '/workmatch', emoji: '❤️', label: 'WorkMatch', desc: 'Scopri colleghi compatibili' },
          { to: '/groups', emoji: '👥', label: 'Gruppi', desc: 'Comunità di interesse' },
          { to: '/map', emoji: '📍', label: 'Mappa Uffici', desc: 'Chi è dove' },
          { to: '/profile', emoji: '✏️', label: 'Il mio profilo', desc: 'Completa il tuo profilo' },
        ].map(({ to, emoji, label, desc }) => (
          <Link
            key={to}
            to={to}
            className="bg-agic-card rounded-xl p-4 border border-agic-border hover:border-agic-primary/30 hover:bg-agic-primary/5 transition-all"
          >
            <div className="text-2xl mb-1">{emoji}</div>
            <div className="font-semibold text-sm text-white">{label}</div>
            <div className="text-xs text-white/40">{desc}</div>
          </Link>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div>
          <h2 className="font-semibold text-white/70 mb-3 text-sm uppercase tracking-wide">Persone che potresti conoscere</h2>
          <div className="space-y-3">
            {suggestions.map((s) => (
              <Link
                key={s.id}
                to={`/profile/${s.id}`}
                className="bg-agic-card rounded-xl p-4 border border-agic-border flex items-center gap-3 hover:border-agic-primary/30 transition-all"
              >
                {s.avatarUrl ? (
                  <img src={s.avatarUrl} alt={s.displayName} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-agic-primary/20 flex items-center justify-center font-bold text-agic-primary">
                    {s.displayName.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium text-sm text-white">{s.displayName}</div>
                  <div className="text-xs text-white/40">{s.role}</div>
                </div>
                <div className="text-sm font-bold text-agic-primary">{Math.round(s.matchScore * 100)}%</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

