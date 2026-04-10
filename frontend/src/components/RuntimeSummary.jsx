import React, { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

function MetricCard({ value, label, colorClass }) {
  const colors = {
    batt:  '#3dd68c',
    gen:   '#f0b840',
    ratio: '#b06af0',
    pct:   '#4f9eff',
  }
  return (
    <div style={{ background: '#131a28', border: '1px solid #1e2a3a', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontSize: 15, fontWeight: 500, color: colors[colorClass] || '#e0e6f0', marginBottom: 2 }}>
        {value}
      </div>
      <div style={{ fontSize: 9, color: '#4f6080', lineHeight: 1.4 }}>{label}</div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#131a28', border: '1px solid #2a3045', borderRadius: 6, padding: '8px 12px', fontSize: 10 }}>
      <div style={{ color: '#6b7a99', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {Number(p.value).toFixed(1)}h</div>
      ))}
    </div>
  )
}

export default function RuntimeSummary({ historyData, loading, days, onDaysChange }) {
  const chartData = useMemo(() => {
    const labels = historyData?.chart?.labels  ?? []
    const batt   = historyData?.chart?.battery ?? []
    const pv     = historyData?.chart?.pv      ?? []
    const n      = Math.min(labels.length, batt.length, pv.length, days)
    return labels.slice(-n).map((label, i) => ({
      label,
      battery:   parseFloat((batt.slice(-n)[i] ?? 0).toFixed(1)),
      generator: parseFloat((pv.slice(-n)[i]   ?? 0).toFixed(1)),
    }))
  }, [historyData, days])

  const summary = historyData?.summary ?? {}
  const battHrs = summary.battery_hrs   ?? 0
  const genHrs  = summary.generator_hrs ?? 0
  const ratio   = summary.ratio         ?? 0
  const pct     = summary.battery_pct   ?? 0

  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e2535' }}>
      {/* Header */}
      <div style={{
        fontSize: 11, color: '#6b7a99', fontWeight: 500,
        letterSpacing: '.5px', textTransform: 'uppercase',
        marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>Runtime Summary</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => onDaysChange(d)} style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 5, cursor: 'pointer',
              border: '1px solid', transition: 'all .15s',
              ...(days === d
                ? { background: '#1e3060', color: '#4f9eff', borderColor: '#2d4a80' }
                : { background: '#161b27', color: '#6b7a99', borderColor: '#2a3045' }),
            }}>
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, marginBottom: 12 }}>
        {loading ? (
          [0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52 }}/>)
        ) : (
          <>
            <MetricCard value={`${battHrs.toFixed(0)}h`}   label="Total Battery Runtime"       colorClass="batt"/>
            <MetricCard value={`${genHrs.toFixed(0)}h`}    label="Total Solar Runtime"          colorClass="gen"/>
            <MetricCard value={ratio.toFixed(2)}            label="Battery / Solar Ratio"        colorClass="ratio"/>
            <MetricCard value={`${pct}%`}                  label="Battery Usage Percentage"     colorClass="pct"/>
          </>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['#3dd68c', 'Battery ON (hours)'], ['#f0b840', 'Solar ON (hours)']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#6b7a99' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }}/>
            {label}
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {loading ? (
        <div className="skeleton" style={{ height: 160 }}/>
      ) : (
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis
                dataKey="label"
                tick={{ fill: '#3d5070', fontSize: 9 }}
                axisLine={false} tickLine={false}
                interval={days <= 7 ? 0 : days <= 14 ? 1 : 2}
              />
              <YAxis
                tick={{ fill: '#3d5070', fontSize: 9 }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `${v}h`}
                domain={[0, 24]}
              />
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="battery"   name="Battery ON"  fill="rgba(61,214,140,0.75)"  stroke="#3dd68c" strokeWidth={1} radius={[3,3,0,0]}/>
              <Bar dataKey="generator" name="Solar ON"    fill="rgba(240,184,64,0.65)"  stroke="#f0b840" strokeWidth={1} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
