import React from 'react'
import EnergyFlowSVG from './EnergyFlowSVG'

function Divider() {
  return <div style={{ width: 1, background: '#1e2a3a', alignSelf: 'stretch' }}/>
}

function RtItem({ label, value, color = '#e0e6f0', sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontSize: 9, color: '#4f6080', textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color }}>{value}</span>
      {sub && <span style={{ fontSize: 8, color: '#4f6080' }}>{sub}</span>}
    </div>
  )
}

function EnergyLabel({ variant, primary, secondary }) {
  const colors = { green: '#3dd68c', amber: '#f0b840', gray: '#6b7a99' }
  return (
    <div style={{
      background: '#1a2235', border: '1px solid #2a3550',
      borderRadius: 6, padding: '5px 10px', fontSize: 10,
    }}>
      <span style={{ fontWeight: 500, color: colors[variant] || '#e0e6f0' }}>{primary}</span>
      {' · '}
      <span style={{ color: '#5a6a88' }}>{secondary}</span>
    </div>
  )
}

export default function RealtimePanel({ data, loading, error, countdown, vessel }) {
  if (error) {
    return (
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e2535' }}>
        <div style={{ background: '#2a1515', border: '1px solid #5a2020', borderRadius: 8, padding: '12px 16px', color: '#e05050', fontSize: 12 }}>
          ⚠ Failed to fetch realtime data: {error}
        </div>
      </div>
    )
  }

  const gen = data?.generator
  const bat = data?.battery
  const sys = data?.system
  const isGenOn  = sys?.is_gen_on ?? false
  const isBattOn = bat?.status === 'DISCHARGING'

  const genLoad    = gen?.load_kw   ?? 0
  const genSupply  = gen?.supply_kw ?? 0
  const genCharge  = gen?.charging_kw ?? 0
  const battLoad   = bat?.load_kw   ?? 0
  const soc        = bat?.soc_percent ?? 0

  const socColor = soc > 60 ? '#3dd68c' : soc > 30 ? '#f0b840' : '#e05050'

  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e2535' }}>
      {/* Ship canvas */}
      <div style={{
        width: '100%', height: 210, background: '#0d1320',
        borderRadius: 10, overflow: 'hidden', marginBottom: 10, position: 'relative',
      }}>
        <EnergyFlowSVG data={data} loading={loading}/>

        {/* Realtime overlay bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(10,16,28,0.88)', padding: '8px 14px',
          display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
          borderTop: '1px solid #1e2a3a',
        }}>
          {loading ? (
            <div style={{ display: 'flex', gap: 16 }}>
              {[80, 80, 70, 80, 90].map((w, i) => (
                <div key={i} className="skeleton" style={{ height: 30, width: w }}/>
              ))}
            </div>
          ) : (
            <>
              <RtItem
                label="Solar Load"
                value={isGenOn ? `${genLoad.toFixed(1)} kW` : '0 kW'}
                color={isGenOn ? '#f0b840' : '#5a6a80'}
                sub={isGenOn ? `Load ${genSupply.toFixed(1)} kW + Charge ${genCharge.toFixed(1)} kW` : 'Standby / OFF'}
              />
              <Divider/>
              <RtItem
                label="Battery Load"
                value={isBattOn ? `${battLoad.toFixed(1)} kW` : '0 kW'}
                color={isBattOn ? '#3dd68c' : '#5a6a80'}
                sub={isBattOn ? 'Discharging to load' : isGenOn ? 'Being Charged' : 'Standby'}
              />
              <Divider/>
              <RtItem
                label="Charging"
                value={isGenOn && genCharge > 0 ? `${genCharge.toFixed(1)} kW` : '0 kW'}
                color={isGenOn && genCharge > 0 ? '#4f9eff' : '#5a6a80'}
              />
              <Divider/>
              <RtItem
                label="Battery SOC"
                value={`${soc.toFixed(1)} %`}
                color={socColor}
              />
              <Divider/>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 9, color: '#4f6080', textTransform: 'uppercase', letterSpacing: '.4px' }}>
                  {isGenOn ? 'Generator ON' : 'Battery ON'}
                </span>
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 10,
                  alignSelf: 'flex-start', marginTop: 2,
                  ...(isGenOn
                    ? { background: '#2a1f0a', color: '#f0b840', border: '1px solid #3a2d0f' }
                    : { background: '#0a2a18', color: '#3dd68c', border: '1px solid #0f3a22' }),
                }}>
                  {isGenOn ? 'Battery Charging' : 'Generator Standby'}
                </span>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{ fontSize: 9, color: '#3d5070' }}>Update in {countdown}s</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Energy label pills */}
      {!loading && data && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <EnergyLabel
            variant={isGenOn ? 'amber' : 'gray'}
            primary={isGenOn ? 'Solar ON' : 'Solar Standby'}
            secondary={isGenOn
              ? `supply ${genSupply.toFixed(1)} kW + charge ${genCharge.toFixed(1)} kW`
              : 'OFF — waiting for sunlight'}
          />
          <EnergyLabel
            variant={isBattOn ? 'green' : isGenOn ? 'amber' : 'gray'}
            primary={isBattOn ? 'Battery ON' : 'Battery'}
            secondary={isBattOn
              ? `Discharging ${battLoad.toFixed(1)} kW to load`
              : isGenOn ? `Charging @ ${genCharge.toFixed(1)} kW` : 'Standby'}
          />
        </div>
      )}

      {/* Live bar */}
      <div style={{
        background: '#1a2235', borderRadius: 6, padding: '7px 12px',
        fontSize: 10, color: '#6b7a99', fontWeight: 500,
        letterSpacing: '.5px', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div className="pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#3dd68c', flexShrink: 0 }}/>
        LIVE MONITORING — Auto-refresh every 5s
      </div>
    </div>
  )
}
