import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import OfficeMap from '../components/OfficeMap'

interface ClusterData {
  officeLocation: string
  coordinates: [number, number]
  userCount: number
}

export default function Map() {
  const [clusters, setClusters] = useState<ClusterData[]>([])
  const [loading, setLoading] = useState(true)
  const [interests, setInterests] = useState<string[]>([])
  const [selectedInterest, setSelectedInterest] = useState('')

  // Fetch available interests once on mount
  useEffect(() => {
    api.get<string[]>('/map/interests').then(setInterests).catch(console.error)
  }, [])

  // Fetch clusters whenever the selected interest changes
  useEffect(() => {
    setLoading(true)
    const path = selectedInterest
      ? `/map/clusters?interest=${encodeURIComponent(selectedInterest)}`
      : '/map/clusters'
    api.get<ClusterData[]>(path)
      .then(setClusters)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedInterest])

  const totalCount = clusters.reduce((s, c) => s + c.userCount, 0)

  return (
    <div className="min-h-screen bg-agic-dark pb-20 md:pt-20 max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-2">Mappa Uffici 📍</h1>
      <p className="text-white/50 text-sm mb-4">Distribuzione dei colleghi per sede</p>

      {/* Interest filter */}
      <div className="flex items-center gap-3 mb-4">
        <label htmlFor="interest-filter" className="text-sm text-white/60 shrink-0">
          Filtra per interesse
        </label>
        <select
          id="interest-filter"
          value={selectedInterest}
          onChange={(e) => setSelectedInterest(e.target.value)}
          className="flex-1 max-w-xs bg-agic-card border border-agic-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-agic-primary/60"
        >
          <option value="">Tutti ({clusters.reduce((s, c) => s + c.userCount, 0) || '…'})</option>
          {interests.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        {selectedInterest && (
          <button
            onClick={() => setSelectedInterest('')}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            ✕ Rimuovi filtro
          </button>
        )}
      </div>

      <div className="h-[420px] rounded-2xl overflow-hidden border border-agic-border">
        {loading ? (
          <div className="w-full h-full bg-agic-card flex items-center justify-center text-white/40 text-sm">
            Caricamento mappa…
          </div>
        ) : clusters.length === 0 ? (
          <div className="w-full h-full bg-agic-card flex items-center justify-center text-white/40 text-sm">
            Nessun collega trovato per &ldquo;{selectedInterest}&rdquo;
          </div>
        ) : (
          <OfficeMap clusters={clusters} />
        )}
      </div>

      {/* Location cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
        {clusters.map((c) => (
          <div key={c.officeLocation} className="bg-agic-card rounded-xl p-3 border border-agic-border">
            <p className="font-medium text-white text-sm">{c.officeLocation}</p>
            <p className="text-xs text-white/40">
              {c.userCount} {c.userCount === 1 ? 'collega' : 'colleghi'}
              {selectedInterest ? ` con interesse "${selectedInterest}"` : ''}
            </p>
          </div>
        ))}
        {selectedInterest && clusters.length > 0 && (
          <div className="bg-agic-primary/10 rounded-xl p-3 border border-agic-primary/30 col-span-full md:col-span-1">
            <p className="font-medium text-agic-primary text-sm">Totale</p>
            <p className="text-xs text-agic-primary/70">{totalCount} {totalCount === 1 ? 'collega' : 'colleghi'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
