import React, { useEffect, useState } from 'react'
import { fetchLocation } from '../api/client'

// Lazy import Leaflet to avoid SSR issues
let L = null

function InfoItem({ label, value, valueStyle }) {
  return (
    <div style={{ background: '#0f1117', borderRadius: 6, padding: 8 }}>
      <div style={{ fontSize: 9, color: '#4f6080', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: '#c8d8f0', fontWeight: 500, ...valueStyle }}>{value}</div>
    </div>
  )
}

export default function LocationTab({ vessel }) {
  const [locData, setLocData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [mapId]   = useState(() => `map-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    if (!vessel?.id) return
    setLoading(true)
    fetchLocation(vessel.id)
      .then(res => { setLocData(res.data); setError(null) })
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  }, [vessel?.id])

  // Init Leaflet map after data loads
  useEffect(() => {
    if (loading || !locData) return

    let map = null
    let mounted = true

    import('leaflet').then(mod => {
      if (!mounted) return
      L = mod.default

      const container = document.getElementById(mapId)
      if (!container) return

      // Determine coordinates
      // Sigenergy returns address string, not GPS. Use geocoded coords or fallback to vessel addr region
      const lat = locData.lat ?? deriveLatFromAddress(locData.address)
      const lng = locData.lng ?? deriveLngFromAddress(locData.address)

      map = L.map(container, { zoomControl: true, attributionControl: false }).setView([lat, lng], 9)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(map)

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:16px;height:16px;border-radius:50%;
          background:#4f9eff;border:2.5px solid #fff;
          box-shadow:0 0 0 4px rgba(79,158,255,0.25);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      const marker = L.marker([lat, lng], { icon }).addTo(map)
      marker.bindPopup(`
        <div style="color:#0f1117;padding:4px">
          <strong>${locData.name}</strong><br/>
          <span style="font-size:11px">${locData.system_id}</span><br/>
          <span style="font-size:11px;color:#444">${locData.address || '—'}</span>
        </div>
      `).openPopup()
    })

    return () => {
      mounted = false
      if (map) { map.remove(); map = null }
    }
  }, [loading, locData, mapId])

  if (!vessel) return null

  return (
    <div style={{ padding: 20 }}>
      {/* Vessel info card */}
      <div style={{ background: '#131a28', border: '1px solid #1e2a3a', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#6b7a99', fontWeight: 500, textTransform: 'uppercase', marginBottom: 8 }}>
          Vessel Information
        </div>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[0,1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 44 }}/>)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            <InfoItem label="System Name"   value={locData?.name       || vessel.name || '—'}/>
            <InfoItem label="System ID"     value={locData?.system_id  || vessel.id   || '—'}/>
            <InfoItem label="Current Status" value={vessel.status === 'normal' ? 'Active' : vessel.status || '—'} valueStyle={{ color: vessel.status === 'normal' ? '#3dd68c' : '#f0b840' }}/>
            <InfoItem label="Address"       value={locData?.address || vessel.address || '—'}/>
            <InfoItem label="Grid Status"   value={locData?.on_grid ? 'On Grid' : 'Off Grid'} valueStyle={{ color: locData?.on_grid ? '#3dd68c' : '#f0b840' }}/>
            <InfoItem label="Timezone"      value={locData?.timezone || vessel.timezone || 'UTC'}/>
          </div>
        )}
        {error && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#e05050' }}>⚠ {error}</div>
        )}
      </div>

      {/* Map */}
      <div
        id={mapId}
        style={{
          width: '100%', height: 420,
          background: '#131a28', border: '1px solid #1e2a3a',
          borderRadius: 10, overflow: 'hidden',
        }}
      />

      {!locData?.lat && !loading && (
        <div style={{ marginTop: 8, fontSize: 10, color: '#4f6080', textAlign: 'center' }}>
          ℹ GPS coordinates not available — map shows estimated location based on address.
          Set GEOCODE_API_KEY in backend .env for precise positioning.
        </div>
      )}
    </div>
  )
}

// Rough coordinate fallbacks based on Sigenergy system addresses (Indonesia region)
function deriveLatFromAddress(addr) {
  if (!addr) return -2.5
  if (addr.toLowerCase().includes('sulawesi')) return -2.5
  if (addr.toLowerCase().includes('jakarta') || addr.toLowerCase().includes('java')) return -6.2
  if (addr.toLowerCase().includes('shanghai')) return 31.2
  return -2.5
}
function deriveLngFromAddress(addr) {
  if (!addr) return 120.0
  if (addr.toLowerCase().includes('sulawesi')) return 121.5
  if (addr.toLowerCase().includes('jakarta') || addr.toLowerCase().includes('java')) return 106.8
  if (addr.toLowerCase().includes('shanghai')) return 121.5
  return 120.0
}
