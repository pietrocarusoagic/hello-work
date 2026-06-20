import { useEffect, useState } from 'react'
import { api, Group } from '../lib/api'

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    api.get<Group[]>('/groups')
      .then(setGroups)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleJoin = async (groupId: string, isMember: boolean) => {
    try {
      if (isMember) {
        await api.delete(`/groups/${groupId}/members/me`)
        setGroups((current) => current.map((g) => g.id === groupId ? { ...g, isMember: false, memberCount: g.memberCount - 1 } : g))
      } else {
        await api.post(`/groups/${groupId}/members`, {})
        setGroups((current) => current.map((g) => g.id === groupId ? { ...g, isMember: true, memberCount: g.memberCount + 1 } : g))
      }
    } catch (e) { console.error(e) }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const g = await api.post<Group>('/groups', { name: newName, description: newDesc, tags: [] })
      setGroups((current) => [g, ...current])
      setNewName(''); setNewDesc(''); setShowForm(false)
    } catch (e) { console.error(e) }
    finally { setCreating(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-agic-dark text-gray-400 dark:text-white/40 text-sm">Caricamento...</div>

  const suggested = groups.filter((g) => g.isSystemSuggested)
  const myGroups = groups.filter((g) => g.isMember)
  const allOther = groups.filter((g) => !g.isSystemSuggested && !g.isMember)

  return (
    <div className="min-h-screen bg-white dark:bg-agic-dark pb-20 md:pt-20 max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          Gruppi <span className="gradient-text">👥</span>
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 gradient-bg text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Nuovo
        </button>
      </div>

      {showForm && (
        <div className="card p-4 shadow-sm mb-6">
          <h3 className="font-semibold mb-3 text-gray-700 dark:text-white/70">Crea un nuovo gruppo</h3>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome del gruppo"
            className="w-full border border-gray-200 dark:border-agic-border rounded-lg px-3 py-2 text-sm mb-2 bg-white dark:bg-agic-dark text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-agic-primary/40 transition-colors"
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Descrizione (opzionale)"
            rows={2}
            className="w-full border border-gray-200 dark:border-agic-border rounded-lg px-3 py-2 text-sm mb-3 bg-white dark:bg-agic-dark text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-agic-primary/40 resize-none transition-colors"
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full gradient-bg text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {creating ? 'Creazione…' : 'Crea Gruppo'}
          </button>
        </div>
      )}

      {suggested.length > 0 && (
        <section className="mb-6">
          <h2 className="font-semibold text-gray-500 dark:text-white/40 text-xs uppercase tracking-wide mb-3">💡 Suggeriti per te</h2>
          <div className="space-y-3">
            {suggested.map((g) => <GroupCard key={g.id} group={g} onToggle={handleJoin} />)}
          </div>
        </section>
      )}

      {myGroups.length > 0 && (
        <section className="mb-6">
          <h2 className="font-semibold text-gray-500 dark:text-white/40 text-xs uppercase tracking-wide mb-3">✅ I tuoi gruppi</h2>
          <div className="space-y-3">
            {myGroups.map((g) => <GroupCard key={g.id} group={g} onToggle={handleJoin} />)}
          </div>
        </section>
      )}

      {allOther.length > 0 && (
        <section>
          <h2 className="font-semibold text-gray-500 dark:text-white/40 text-xs uppercase tracking-wide mb-3">🔍 Tutti i gruppi</h2>
          <div className="space-y-3">
            {allOther.map((g) => <GroupCard key={g.id} group={g} onToggle={handleJoin} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function GroupCard({ group, onToggle }: { group: Group; onToggle: (id: string, isMember: boolean) => void }) {
  return (
    <div className="card p-4 shadow-sm hover:border-agic-secondary/40 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{group.name}</h3>
            {group.isSystemSuggested && (
              <span className="text-xs px-1.5 py-0.5 bg-agic-secondary/10 text-agic-secondary rounded-full">AI</span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">{group.description}</p>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-1">👥 {group.memberCount} membri</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {group.tags.slice(0, 3).map((t) => (
              <span key={t} className="px-1.5 py-0.5 bg-gray-100 dark:bg-agic-border text-gray-600 dark:text-white/50 rounded-full text-xs">{t}</span>
            ))}
          </div>
        </div>
        <button
          onClick={() => onToggle(group.id, group.isMember)}
          className={`ml-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            group.isMember
              ? 'bg-gray-100 dark:bg-agic-border text-gray-600 dark:text-white/60 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600'
              : 'gradient-bg text-white hover:opacity-90'
          }`}
        >
          {group.isMember ? 'Esci' : 'Unisciti'}
        </button>
      </div>
    </div>
  )
}
