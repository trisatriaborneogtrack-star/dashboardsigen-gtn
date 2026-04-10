import React, { useMemo } from 'react'
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, YAxis,
} from 'recharts'

function SparkCard({ title, badge, badgeClass, value, sub, subColor, histPoints, lineColor, fillColor, loading }) {
  const chartData = useMemo(() => {
    if (!histPoints?.length) return Array.from({ length: 24 }, (_, i) => ({ v: 0 }))
    return histPoints.map(v => ({ v }))
  }, [histPoints])

  const badgeStyle = badgeClass === 'on'
    ? { background: '#0a2a18', color: '#3dd68c', border: '1px solid #0f3a22' }
    : badgeClass === 'gen'
    ? { background: '#2a1f0a', color: '#f0b840', border: '1px solid #3a2d0f' }
    : { background: '#1e2235', color: '#6b7a99', border: '1px solid #2a3045' }

  return (
    <div style={{ background: '#131a28', border: '1px solid #1e2a3a', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#5a6a88', marginBottom: 3 }}>
        <span>{title}</span>
        <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, fontWeight: 500, ...badgeStyle }}>{badge}</span>
      </div>

      {loading ? (
        <>
          <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 6 }}/>
          <div className="skeleton" style={{ height: 10, width: '80%', marginBottom: 10 }}/>
          <div className="skeleton" style={{ height: 65, width: '100%' }}/>
        </>
      ) : (
        <>
          <div style={{ fontSize: 18, fontWeight: 500, color: '#c8d8f0', marginBottom: 2 }}>{value}</div>
          <div style={{ fontSize: 10, color: subColor, marginBottom: 8 }}>{sub}</div>
          <div style={{ position: 'relative', height: 65 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${lineColor.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={lineColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={lineColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis domain={['auto','auto']} hide/>
                <Tooltip
                  contentStyle={{ background: '#131a28', border: '1px solid #2a3045', borderRadius: 6, fontSize: 10 }}
                  labelStyle={{ color: '#4f6080' }}
                  itemStyle={{ color: lineColor }}
                  formatter={v => [`${Number(v).toFixed(1)} h`, '']}
                  labelFormatter={() => ''}
                />
                <Area
                  type="monotone" dataKey="v"
                  stroke={lineColor} strokeWidth={2}
                  fill={`url(#grad-${lineColor.replace('#','')})`}
                  dot={false} activeDot={{ r: 3, fill: lineColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

export default function AreaCharts({ realtimeData, historyData, historyLoading }) {
  const isGenOn  = realtimeData?.system?.is_gen_on ?? false
  const isBattOn = realtimeData?.battery?.status === 'DISCHARGING'

  // Today's runtime (hours) estimated from daily energy / rated power
  const dailyKwh    = realtimeData?.system?.daily_pv_kwh ?? 0
  const pvCapacity  = 5   // kW rated — will be refined from vessel data
  const batCapacity = 5   // kW rated — will be refined from vessel data

  const battHrsToday = historyData?.summary?.battery_hrs  ?? 0
  const genHrsToday  = historyData?.summary?.generator_hrs ?? 0

  // Chart sparkline: use history battery/pv arrays (last 24 points = hourly slices)
  const battPoints = historyData?.chart?.battery?.slice(-24) ?? []
  const pvPoints   = historyData?.chart?.pv?.slice(-24)      ?? []

  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e2535' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <SparkCard
          title="Battery Runtime Today"
          badge={isBattOn ? 'ON' : 'STANDBY'}
          badgeClass={isBattOn ? 'on' : 'standby'}
          value={`${battHrsToday.toFixed(1)} hours`}
          sub={isBattOn ? 'Discharging to supply load' : 'Waiting for discharge'}
          subColor="#3dd68c"
          histPoints={battPoints}
          lineColor="#3dd68c"
          loading={historyLoading}
        />
        <SparkCard
          title="Solar Runtime Today"
          badge={isGenOn ? 'ON' : 'STANDBY'}
          badgeClass={isGenOn ? 'gen' : 'standby'}
          value={`${genHrsToday.toFixed(1)} hours`}
          sub={isGenOn ? 'Charging + supplying load' : 'Waiting for sunlight'}
          subColor="#f0b840"
          histPoints={pvPoints}
          lineColor="#f0b840"
          loading={historyLoading}
        />
      </div>
    </div>
  )
}
