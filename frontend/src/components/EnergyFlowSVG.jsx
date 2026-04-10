import React, { useEffect, useRef } from 'react'

/**
 * EnergyFlowSVG — mirrors the ship canvas from the mockup.
 * Drives SVG paths and labels based on live data from Sigenergy API:
 *   data.generator  → PV / solar source
 *   data.battery    → SigenStor battery
 *   data.system     → mode flags
 */
export default function EnergyFlowSVG({ data, loading }) {
  const genToBattRef  = useRef()
  const genToLoadRef  = useRef()
  const battToLoadRef = useRef()
  const genKwRef      = useRef()
  const battKwRef     = useRef()
  const genChargeRef  = useRef()
  const modeLabelRef  = useRef()
  const pulseDotRef   = useRef()

  useEffect(() => {
    if (!data) return
    const { generator: gen, battery: bat, system: sys } = data
    const isGenOn = sys.is_gen_on
    const isBattOn = bat.status === 'DISCHARGING'

    const set = (ref, attr, val) => ref.current?.setAttribute(attr, val)
    const setText = (ref, val) => { if (ref.current) ref.current.textContent = val }

    if (isGenOn) {
      set(genToBattRef,  'opacity', gen.charging_kw > 0.1 ? '0.9' : '0')
      set(genToLoadRef,  'opacity', gen.supply_kw   > 0.1 ? '0.9' : '0')
      set(battToLoadRef, 'opacity', '0')
      set(genKwRef,  'opacity', '1')
      setText(genKwRef, `${gen.load_kw.toFixed(1)} kW`)
      set(battKwRef, 'opacity', '0')
      set(genChargeRef, 'opacity', gen.charging_kw > 0.1 ? '1' : '0')
      setText(genChargeRef, `Charging +${gen.charging_kw.toFixed(1)} kW`)
      setText(modeLabelRef, gen.charging_kw > 0.1 ? 'Solar ON — Charging & Supply' : 'Solar ON — Supplying Load')
      set(modeLabelRef, 'fill', '#f0b840')
    } else if (isBattOn) {
      set(genToBattRef,  'opacity', '0')
      set(genToLoadRef,  'opacity', '0')
      set(battToLoadRef, 'opacity', '0.9')
      set(genKwRef,  'opacity', '0')
      set(battKwRef, 'opacity', '1')
      setText(battKwRef, `${bat.load_kw.toFixed(1)} kW`)
      set(genChargeRef, 'opacity', '0')
      setText(modeLabelRef, 'Battery ON — Discharging')
      set(modeLabelRef, 'fill', '#3dd68c')
    } else {
      set(genToBattRef,  'opacity', '0')
      set(genToLoadRef,  'opacity', '0')
      set(battToLoadRef, 'opacity', '0')
      set(genKwRef,  'opacity', '0')
      set(battKwRef, 'opacity', '0')
      set(genChargeRef, 'opacity', '0')
      setText(modeLabelRef, 'System Standby')
      set(modeLabelRef, 'fill', '#6b7a99')
    }
  }, [data])

  return (
    <svg width="100%" height="210" viewBox="0 0 680 210" xmlns="http://www.w3.org/2000/svg">
      <rect width="680" height="210" fill="#0d1320"/>
      <ellipse cx="340" cy="195" rx="285" ry="18" fill="#0d2040" opacity="0.45"/>

      {/* Hull */}
      <path d="M75 155 L98 115 L582 115 L605 155 L560 172 L120 172 Z" fill="#1a2a45" stroke="#2a3d5e" strokeWidth="1.5"/>
      {/* Cabin */}
      <path d="M120 115 L132 85 L438 85 L450 115" fill="#1e3255" stroke="#2a3d5e" strokeWidth="1"/>
      {/* Home icon area */}
      <rect x="170" y="120" width="68" height="28" rx="3" fill="#12243a" stroke="#1a3555" strokeWidth="1"/>
      <text x="188" y="137" fontSize="9" fill="#8aaac8" fontWeight="500">HOME</text>

      {/* SigenStor battery unit */}
      <rect x="460" y="80" width="72" height="52" rx="4" fill="#0f2535" stroke="#1e3d50" strokeWidth="1"/>
      <rect x="466" y="85" width="28" height="42" rx="3" fill="#1a3a55" stroke="#2a5070" strokeWidth="0.8"/>
      <rect x="498" y="85" width="27" height="42" rx="3" fill="#f5f6f8" stroke="#dde0e8" strokeWidth="0.8"/>
      <text x="500" y="105" fontSize="6" fill="#334" fontWeight="500">Sigen</text>
      <text x="501" y="115" fontSize="6" fill="#334">Stor</text>
      <text x="452" y="76" fontSize="9" fill="#3dd68c" fontWeight="500">SigenStor</text>

      {/* PV panels (top-right of cabin) */}
      <rect x="200" y="60" width="100" height="22" rx="3" fill="#1a3a55" stroke="#2a5575" strokeWidth="0.8"/>
      {[210,226,242,258,274].map(x => (
        <line key={x} x1={x} y1="60" x2={x} y2="82" stroke="#2a5070" strokeWidth="0.5"/>
      ))}
      {[71,77].map(y => (
        <line key={y} x1="200" y1={y} x2="300" y2={y} stroke="#2a5070" strokeWidth="0.5"/>
      ))}
      <text x="216" y="74" fontSize="7" fill="#4f9eff" fontWeight="500">SOLAR PV</text>

      {/* Flow paths */}
      <path
        ref={genToBattRef}
        id="genToBattPath"
        d="M300 71 Q390 71 470 88"
        stroke="#f0b840" strokeWidth="2.5" fill="none"
        opacity="0" strokeDasharray="6 3"
        className="flow-anim"
      />
      <path
        ref={genToLoadRef}
        id="genToLoadPath"
        d="M250 82 Q250 110 230 118"
        stroke="#f0b840" strokeWidth="2.5" fill="none"
        opacity="0" strokeDasharray="6 3"
        className="flow-anim"
      />
      <path
        ref={battToLoadRef}
        id="battToLoadPath"
        d="M466 106 Q380 106 250 106 Q230 106 222 120"
        stroke="#3dd68c" strokeWidth="2.5" fill="none"
        opacity="0" strokeDasharray="6 3"
        className="flow-anim"
      />

      {/* Labels */}
      <text ref={genKwRef}  id="genKwLabel"    x="310" y="64" fontSize="8" fill="#f0b840" fontWeight="500" opacity="0">0 kW</text>
      <text ref={battKwRef} id="battKwLabel"   x="345" y="100" fontSize="8" fill="#3dd68c" fontWeight="500" opacity="0">0 kW</text>
      <text ref={genChargeRef} id="genChargeLabel" x="382" y="82" fontSize="7" fill="#f0b840" opacity="0">+0 kW</text>

      {/* Mode label bottom-left */}
      <text ref={modeLabelRef} id="modeLabel" x="30" y="100" fontSize="10" fill="#3dd68c" fontWeight="500">
        {loading ? 'Loading...' : 'System Standby'}
      </text>

      {/* Pulse dot */}
      <circle ref={pulseDotRef} cx="205" cy="134" r="2.5" fill="#3dd68c" className="pulse"/>

      {/* SOC bar (right side, next to battery) */}
      {data && (
        <>
          <rect x="545" y="85" width="6" height="42" rx="2" fill="#1e2a3a"/>
          <rect
            x="545"
            y={85 + 42 * (1 - Math.min(1, Math.max(0, data.battery.soc_percent / 100)))}
            width="6"
            height={42 * Math.min(1, Math.max(0, data.battery.soc_percent / 100))}
            rx="2"
            fill={data.battery.soc_percent > 60 ? '#3dd68c' : data.battery.soc_percent > 30 ? '#f0b840' : '#e05050'}
          />
          <text x="555" y="106" fontSize="7" fill="#6b7a99">{data.battery.soc_percent.toFixed(0)}%</text>
        </>
      )}
    </svg>
  )
}
