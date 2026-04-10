import React, { useState } from 'react'

function SolarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f9eff" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="11" rx="2"/>
      <path d="M8 19h8m-4-5v5"/>
    </svg>
  )
}

function StatusDot({ status }) {
  const isNormal = status === 'normal'
  const color    = isNormal ? '#3dd68c' : status === 'fault' ? '#e05050' : '#f0b840'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }}/>
      {isNormal ? 'Normal' : status === 'fault' ? 'Fault' : status === 'offline' ? 'Offline' : 'Standby'}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e2535' }}>
      <div className="skeleton" style={{ height: 34, width: '100%', marginBottom: 8 }}/>
      <div className="skeleton" style={{ height: 10, width: '60%', marginBottom: 6 }}/>
      <div className="skeleton" style={{ height: 10, width: '40%' }}/>
    </div>
  )
}

export default function Sidebar({ vessels, loading, error, selectedId, onSelect }) {
  const [query, setQuery] = useState('')

  const filtered = vessels.filter(v =>
    v.name.toLowerCase().includes(query.toLowerCase()) ||
    v.id.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={{
      width: 276, minWidth: 276, background: '#161b27',
      borderRight: '1px solid #2a3045', display: 'flex',
      flexDirection: 'column', overflowY: 'auto',
    }}>
      {/* Search */}
      <div style={{ padding: '14px 12px', borderBottom: '1px solid #2a3045' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#1e2535', border: '1px solid #2a3045',
          borderRadius: 8, padding: '7px 10px',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search System Name or ID"
            style={{ background: 'none', border: 'none', outline: 'none', color: '#9aaac8', fontSize: 11, width: '100%' }}
          />
        </div>
      </div>

      {/* List */}
      <div>
        {loading && [0,1,2].map(i => <SkeletonCard key={i}/>)}

        {error && (
          <div style={{ padding: '16px 14px', fontSize: 11, color: '#e05050' }}>
            ⚠ Failed to load vessels<br/>
            <span style={{ color: '#4f6080', fontSize: 10 }}>{error}</span>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: '16px 14px', fontSize: 11, color: '#4f6080' }}>
            No systems found
          </div>
        )}

        {!loading && filtered.map(vessel => (
          <div
            key={vessel.id}
            onClick={() => onSelect(vessel)}
            style={{
              padding: '12px 14px', cursor: 'pointer',
              borderBottom: '1px solid #1e2535',
              background: selectedId === vessel.id ? '#1a2340' : 'transparent',
              borderLeft: selectedId === vessel.id ? '3px solid #4f9eff' : '3px solid transparent',
              transition: 'background .15s',
            }}
            onMouseEnter={e => { if (selectedId !== vessel.id) e.currentTarget.style.background = '#1c2233' }}
            onMouseLeave={e => { if (selectedId !== vessel.id) e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 7 }}>
              <div style={{
                width: 34, height: 34, background: '#1e2a42', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <SolarIcon/>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#c8d8f0', lineHeight: 1.3, marginBottom: 2 }}>
                  {vessel.name}
                </div>
                <div style={{ fontSize: 10, color: '#4f6080', lineHeight: 1.3, marginBottom: 2 }}>
                  {vessel.address || '—'}
                </div>
                <div style={{ fontSize: 9, color: '#3d5070', fontFamily: 'monospace' }}>
                  {vessel.id}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 9, color: '#6b8aaa', marginBottom: 5 }}>
              {vessel.pv_capacity > 0 ? `${vessel.pv_capacity} kWp` : '—'} · {vessel.bat_capacity > 0 ? `${vessel.bat_capacity} kWh` : '—'}
            </div>
            <StatusDot status={vessel.status}/>
          </div>
        ))}
      </div>
    </div>
  )
}
