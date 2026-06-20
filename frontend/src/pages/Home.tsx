import { useCallback, useEffect, useRef, useState } from 'react'
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
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    Promise.all([
      api.get<UserProfile>('/profiles/me'),
      api.get<WorkMatchCard[]>('/matches/suggestions?limit=4'),
    ])
      .then(([p, s]) => { setProfile(p); setSuggestions(s) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const runSearch = useCallback((q: string) => {
    setSearching(true)
    api.get<UserProfile[]>(`/profiles?q=${encodeURIComponent(q)}`)
      .then(setSearchResults)
      .catch(console.error)
      .finally(() => setSearching(false))
  }, [])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) { setSearchResults([]); return }
    debounceRef.current = setTimeout(() => runSearch(value.trim()), 300)
  }

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

      {/* Search bar */}
      <div className="relative mb-6">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Cerca per nome, ruolo, dipartimento…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-pulse">…</span>
        )}
      </div>

      {/* Search results */}
      {query.trim() ? (
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">
            {!searching && searchResults.length === 0
              ? 'Nessun risultato trovato'
              : `${searchResults.length} colleghi trovati`}
          </h2>
          <div className="space-y-3">
            {searchResults.map((u) => <ColleagueCard key={u.id} user={u} />)}
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}

function ColleagueCard({ user }: { user: UserProfile }) {
  const topSkills = user.skills.slice(0, 3)
  const topInterests = [...user.hobbies, ...user.interests].slice(0, 3)

  return (
    <Link
      to={`/profile/${user.id}`}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-3 hover:shadow-md transition-shadow"
    >
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.displayName} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600 flex-shrink-0 text-lg">
          {user.displayName.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-gray-800">{user.displayName}</div>
        <div className="text-xs text-gray-500 mb-2">
          {[user.role, user.department].filter(Boolean).join(' — ')}
        </div>
        <div className="flex flex-wrap gap-1">
          {topSkills.map((s) => (
            <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">💼 {s}</span>
          ))}
          {topInterests.map((s) => (
            <span key={s} className="px-1.5 py-0.5 bg-pink-50 text-pink-700 rounded-full text-xs">❤️ {s}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}
