import React, { useState, useEffect } from 'react'
import Sidebar       from './components/Sidebar'
import RealtimePanel from './components/RealtimePanel'
import AreaCharts    from './components/AreaCharts'
import RuntimeSummary from './components/RuntimeSummary'
import LocationTab   from './components/LocationTab'
import { useVessels }  from './hooks/useVessels'
import { useRealtime } from './hooks/useRealtime'
import { useHistory }  from './hooks/useHistory'

export default function App() {
  const [selectedVessel, setSelectedVessel] = useState(null)
  const [activeTab,      setActiveTab]      = useState('system')
  const [days,           setDays]           = useState(7)

  const { vessels, loading: vLoading, error: vError } = useVessels()

  // Auto-select first vessel
  useEffect(() => {
    if (vessels.length > 0 && !selectedVessel) {
      setSelectedVessel(vessels[0])
    }
  }, [vessels, selectedVessel])

  const { data: rtData, loading: rtLoading, error: rtError, countdown } =
    useRealtime(selectedVessel?.id)

  const { data: histData, loading: histLoading } =
    useHistory(selectedVessel?.id, days)

  function handleSelectVessel(vessel) {
    setSelectedVessel(vessel)
    setActiveTab('system')
  }

  return (
    <div style={{
      display: 'flex', height: '100vh', minHeight: 750,
      background: '#0f1117', color: '#e0e6f0',
      fontFamily: 'system-ui, sans-serif', overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <Sidebar
        vessels={vessels}
        loading={vLoading}
        error={vError}
        selectedId={selectedVessel?.id}
        onSelect={handleSelectVessel}
      />

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#0f1117' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e2535', flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: '#8a9abf', marginBottom: 8 }}>
            {selectedVessel?.name || 'No system selected'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['System', 'Location'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} style={{
                padding: '6px 18px', fontSize: 12,
                border: '1px solid', borderRadius: 6, cursor: 'pointer', transition: 'all .15s',
                ...(activeTab === tab.toLowerCase()
                  ? { background: '#2d5090', borderColor: '#4f9eff', color: '#4f9eff' }
                  : { background: '#1e3060', borderColor: '#2d4a80', color: '#4f9eff' }),
              }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* System Tab */}
        {activeTab === 'system' && (
          <>
            {!selectedVessel ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f6080', fontSize: 13 }}>
                Select a system from the sidebar
              </div>
            ) : (
              <>
                <RealtimePanel
                  data={rtData}
                  loading={rtLoading}
                  error={rtError}
                  countdown={countdown}
                  vessel={selectedVessel}
                />
                <AreaCharts
                  realtimeData={rtData}
                  historyData={histData}
                  historyLoading={histLoading}
                />
                <RuntimeSummary
                  historyData={histData}
                  loading={histLoading}
                  days={days}
                  onDaysChange={setDays}
                />
              </>
            )}
          </>
        )}

        {/* Location Tab */}
        {activeTab === 'location' && (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <LocationTab vessel={selectedVessel}/>
          </div>
        )}
      </div>
    </div>
  )
}
