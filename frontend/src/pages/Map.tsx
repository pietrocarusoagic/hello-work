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
    <div className="min-h-screen pb-20 md:pt-20 max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Mappa Uffici 📍</h1>
      <p className="text-gray-500 text-sm mb-6">Distribuzione dei colleghi per sede</p>

      <div className="h-[420px] rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        {loading ? (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">Caricamento mappa…</div>
        ) : (
          <OfficeMap clusters={clusters} />
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
        {clusters.map((c) => (
          <div key={c.officeLocation} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <p className="font-medium text-gray-800 text-sm">{c.officeLocation}</p>
            <p className="text-xs text-gray-500">{c.userCount} colleghi</p>
          </div>
        ))}
      </div>
    </div>
  )
}
