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

  useEffect(() => {
    api.get<ClusterData[]>('/map/clusters')
      .then(setClusters)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-agic-dark pb-20 md:pt-20 max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-1">
        Mappa <span className="gradient-text">Uffici</span> 📍
      </h1>
      <p className="text-gray-500 dark:text-white/50 text-sm mb-6">Distribuzione dei colleghi per sede</p>

      <div className="h-[420px] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-agic-border">
        {loading ? (
          <div className="w-full h-full bg-gray-100 dark:bg-agic-card flex items-center justify-center text-gray-400 dark:text-white/40 text-sm">Caricamento mappa…</div>
        ) : (
          <OfficeMap clusters={clusters} />
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
        {clusters.map((c) => (
          <div key={c.officeLocation} className="card p-3 shadow-sm">
            <p className="font-medium text-gray-800 dark:text-white text-sm">{c.officeLocation}</p>
            <p className="text-xs text-gray-500 dark:text-white/50">{c.userCount} colleghi</p>
          </div>
        ))}
      </div>
    </div>
  )
}
