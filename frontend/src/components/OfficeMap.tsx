import { useEffect, useRef } from 'react'
import * as atlas from 'azure-maps-control'
import 'azure-maps-control/dist/atlas.min.css'

interface OfficeCluster {
  officeLocation: string
  coordinates: [number, number]
  userCount: number
}

interface Props {
  clusters: OfficeCluster[]
}

const AZURE_MAPS_KEY = import.meta.env.VITE_AZURE_MAPS_KEY || ''

export default function OfficeMap({ clusters }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<atlas.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || !AZURE_MAPS_KEY) return

    mapInstance.current = new atlas.Map(mapRef.current, {
      center: [12.4964, 41.9028],
      zoom: 5,
      authOptions: {
        authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: AZURE_MAPS_KEY,
      },
    })

    mapInstance.current.events.add('ready', () => {
      if (!mapInstance.current) return

      const datasource = new atlas.source.DataSource()
      mapInstance.current.sources.add(datasource)

      clusters.forEach((c) => {
        const point = new atlas.data.Feature(
          new atlas.data.Point(c.coordinates),
          { location: c.officeLocation, count: c.userCount },
        )
        datasource.add(point)
      })

      mapInstance.current.layers.add(
        new atlas.layer.BubbleLayer(datasource, undefined, {
          radius: ['interpolate', ['linear'], ['get', 'count'], 1, 8, 50, 24],
          color: '#3b82f6',
          strokeColor: 'white',
          strokeWidth: 2,
          opacity: 0.8,
        }),
      )
    })

    return () => mapInstance.current?.dispose()
  }, [clusters])

  if (!AZURE_MAPS_KEY) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm px-4 text-center">
        Configura VITE_AZURE_MAPS_KEY per visualizzare la mappa.
      </div>
    )
  }

  return <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden" />
}
