import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface OfficeCluster {
  officeLocation: string
  coordinates: [number, number]
  userCount: number
}

interface Props {
  clusters: OfficeCluster[]
}

export default function OfficeMap({ clusters }: Props) {
  return (
    <MapContainer
      center={[42.5, 12.5]}
      zoom={5}
      scrollWheelZoom={false}
      style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {clusters.map((c) => (
        <CircleMarker
          key={c.officeLocation}
          center={[c.coordinates[1], c.coordinates[0]]}
          radius={Math.max(10, Math.min(28, 8 + c.userCount * 2))}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: '#3b82f6',
            fillOpacity: 0.85,
          }}
        >
          <Tooltip permanent direction="center" className="cluster-label">
            {c.userCount}
          </Tooltip>
          <Popup>
            <div style={{ textAlign: 'center', minWidth: 100 }}>
              <strong>{c.officeLocation}</strong>
              <br />
              {c.userCount} {c.userCount === 1 ? 'persona' : 'persone'}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
