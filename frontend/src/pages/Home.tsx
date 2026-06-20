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

      {/* Search results */}
      {query.trim() ? (
        <div>
          <h2 className="font-semibold text-white/70 mb-3 text-sm uppercase tracking-wide">Persone che potresti conoscere</h2>
          <div className="space-y-3">
            {searchResults.map((u) => <ColleagueCard key={u.id} user={u} />)}
          </div>
        </div>
      ) : (
        <>
          {suggestions.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-700 dark:text-white/70 mb-3 text-sm">Persone che potresti conoscere</h2>
              <div className="space-y-3">
                {suggestions.map((s) => (
                  <Link
                    key={s.id}
                    to={`/profile/${s.id}`}
                    className="card p-4 shadow-sm flex items-center gap-3 hover:shadow-md hover:border-agic-secondary/40 transition-all duration-200"
                  >
                    {s.avatarUrl ? (
                      <img src={s.avatarUrl} alt={s.displayName} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center font-bold text-white text-sm">
                        {s.displayName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-800 dark:text-white">{s.displayName}</div>
                      <div className="text-xs text-gray-500 dark:text-white/50">{s.role}</div>
                    </div>
                    <div className="text-sm font-bold gradient-text">{Math.round(s.matchScore * 100)}%</div>
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
      className="card p-4 shadow-sm flex items-start gap-3 hover:shadow-md hover:border-agic-secondary/40 transition-all duration-200"
    >
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.displayName} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center font-bold text-white flex-shrink-0 text-lg">
          {user.displayName.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-gray-800 dark:text-white">{user.displayName}</div>
        <div className="text-xs text-gray-500 dark:text-white/50 mb-2">
          {[user.role, user.department].filter(Boolean).join(' — ')}
        </div>
        <div className="flex flex-wrap gap-1">
          {topSkills.map((s) => (
            <span key={s} className="px-1.5 py-0.5 bg-agic-primary/10 text-agic-primary dark:text-agic-primary rounded-full text-xs">💼 {s}</span>
          ))}
          {topInterests.map((s) => (
            <span key={s} className="px-1.5 py-0.5 bg-agic-secondary/10 text-agic-secondary rounded-full text-xs">❤️ {s}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}
