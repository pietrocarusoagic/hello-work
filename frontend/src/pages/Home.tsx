import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { api, UserProfile, WorkMatchCard } from '../lib/api'
import { DEV_BYPASS, DEV_MOCK_ACCOUNT } from '../lib/devBypass'
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
    ? DEV_MOCK_ACCOUNT.name
    : (accounts[0]?.name ?? 'Collega')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 md:pt-20 max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ciao, {userName.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Scopri i tuoi colleghi</p>
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
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-1">{emoji}</div>
            <div className="font-semibold text-sm text-gray-800">{label}</div>
            <div className="text-xs text-gray-500">{desc}</div>
          </Link>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">Persone che potresti conoscere</h2>
          <div className="space-y-3">
            {suggestions.map((s) => (
              <Link
                key={s.id}
                to={`/profile/${s.id}`}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                {s.avatarUrl ? (
                  <img src={s.avatarUrl} alt={s.displayName} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600">
                    {s.displayName.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-800">{s.displayName}</div>
                  <div className="text-xs text-gray-500">{s.role}</div>
                </div>
                <div className="text-sm font-bold text-primary-600">{Math.round(s.matchScore * 100)}%</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
