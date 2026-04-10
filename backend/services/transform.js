/**
 * Transform Sigenergy API responses → frontend-friendly format
 *
 * Sigenergy field reference:
 *   pvPower        → Solar PV generation (kW)
 *   gridPower      → Grid power (+sell / -buy, kW)
 *   batteryPower   → Battery (+charging / -discharging, kW)
 *   batterySoc     → Battery state of charge (%)
 *   loadPower      → Load consumption (kW)
 *   evPower        → EV charger power (kW)
 *   heatPumpPower  → Heat pump power (kW)
 */

/**
 * Transform energy flow snapshot into dashboard format.
 * In the vessel context:
 *   - "Generator" slot → PV/Solar (the generation source)
 *   - "Battery" slot   → SigenStor battery
 */
function transformEnergyFlow(flowData, realtimeSummary = {}) {
  if (!flowData) return null;

  const pvPower      = parseFloat(flowData.pvPower      ?? 0);
  const gridPower    = parseFloat(flowData.gridPower     ?? 0); // + = export, - = import
  const batteryPower = parseFloat(flowData.batteryPower  ?? 0); // + = charging, - = discharging
  const batterySoc   = parseFloat(flowData.batterySoc   ?? 0);
  const loadPower    = parseFloat(flowData.loadPower     ?? 0);
  const evPower      = parseFloat(flowData.evPower       ?? 0);

  // Charging = battery absorbing power (positive batteryPower)
  const chargingKw    = batteryPower > 0 ? parseFloat(batteryPower.toFixed(2)) : 0;
  // Discharging = battery supplying power (negative batteryPower)
  const dischargingKw = batteryPower < 0 ? parseFloat((-batteryPower).toFixed(2)) : 0;

  // PV supply to load = pvPower - what goes to battery
  const pvSupplyKw = Math.max(0, parseFloat((pvPower - chargingKw).toFixed(2)));

  // Determine operational mode
  let mode = 'STANDBY';
  let isGenOn = false;

  if (pvPower > 0.1) {
    isGenOn = true;
    if (chargingKw > 0.1) {
      mode = 'GENERATOR_CHARGING';
    } else {
      mode = 'GENERATOR_ON';
    }
  } else if (dischargingKw > 0.1) {
    mode = 'BATTERY_ON';
  } else if (gridPower < -0.1) {
    mode = 'GRID_IMPORT';
  }

  return {
    generator: {
      status:      pvPower > 0.1 ? 'ON' : 'STANDBY',
      load_kw:     parseFloat(pvPower.toFixed(2)),
      supply_kw:   pvSupplyKw,
      charging_kw: chargingKw,
    },
    battery: {
      status:      batteryPower < -0.1 ? 'DISCHARGING' : batteryPower > 0.1 ? 'CHARGING' : 'STANDBY',
      load_kw:     dischargingKw,
      charge_kw:   chargingKw,
      soc_percent: parseFloat(batterySoc.toFixed(1)),
    },
    grid: {
      power_kw:   parseFloat(gridPower.toFixed(2)),
      importing:  gridPower < 0,
      exporting:  gridPower > 0,
    },
    load: {
      power_kw:  parseFloat(loadPower.toFixed(2)),
      ev_kw:     parseFloat(evPower.toFixed(2)),
    },
    system: {
      mode,
      is_gen_on:   isGenOn,
      last_update: new Date().toISOString(),
      daily_pv_kwh: parseFloat(realtimeSummary.dailyPowerGeneration   ?? 0),
      monthly_kwh:  parseFloat(realtimeSummary.monthlyPowerGeneration ?? 0),
      annual_kwh:   parseFloat(realtimeSummary.annualPowerGeneration  ?? 0),
    },
  };
}

/**
 * Transform system list records into sidebar vessel cards
 */
function transformSystemList(records) {
  return records.map(sys => ({
    id:          sys.systemId   || sys.id || '',
    name:        sys.systemName || sys.name || 'Unknown System',
    address:     sys.addr       || sys.address || '—',
    status:      (sys.status || 'Unknown').toLowerCase(),
    is_active:   sys.isActivate ?? true,
    on_grid:     sys.onOffGridStatus === 'onGrid' || sys.onOffGridStatus === 'on',
    timezone:    sys.timeZone   || 'UTC',
    pv_capacity: parseFloat(sys.pvCapacity  ?? 0),   // kWp
    bat_capacity:parseFloat(sys.batteryCapacity ?? 0), // kWh
    grid_time:   sys.gridConnectTime || sys.gridConnectedTime || null,
  }));
}

/**
 * Transform historical data into chart-ready arrays
 */
function transformHistory(histData, days = 30) {
  if (!histData) return { labels: [], battery: [], pv: [], loadEnergy: [] };

  const itemList = histData.itemList || [];

  // Aggregate daily summaries from itemList
  const dayMap = {};
  for (const item of itemList) {
    const dateKey = (item.dataTime || '').split(' ')[0];
    if (!dateKey) continue;
    if (!dayMap[dateKey]) {
      dayMap[dateKey] = { pvGen: 0, esCharge: 0, esDischarge: 0, loadPwr: 0, count: 0 };
    }
    dayMap[dateKey].pvGen       += parseFloat(item.pvTotalPower ?? item.powerGeneration ?? 0);
    dayMap[dateKey].esCharge    += parseFloat(item.esChargePower    ?? 0);
    dayMap[dateKey].esDischarge += parseFloat(item.esDischargePower ?? 0);
    dayMap[dateKey].loadPwr     += parseFloat(item.loadPower ?? 0);
    dayMap[dateKey].count++;
  }

  // Use top-level daily totals if itemList is sparse
  const pvTotal  = parseFloat(histData.powerGeneration ?? 0);
  const esChgTotal = parseFloat(histData.esCharging    ?? 0);
  const esDchTotal = parseFloat(histData.esDischarging ?? 0);

  const keys = Object.keys(dayMap).sort();

  if (keys.length === 0) {
    // No itemList: return single-day total
    return {
      labels:     ['Today'],
      pv:         [pvTotal],
      battery:    [esDchTotal],
      loadEnergy: [parseFloat(histData.powerUse ?? 0)],
    };
  }

  return {
    labels:     keys.slice(-days).map(k => k.slice(5)),  // MM-DD
    pv:         keys.slice(-days).map(k => parseFloat((dayMap[k].pvGen / Math.max(1, dayMap[k].count) * 0.083).toFixed(2))),
    battery:    keys.slice(-days).map(k => parseFloat((dayMap[k].esDischarge / Math.max(1, dayMap[k].count) * 0.083).toFixed(2))),
    loadEnergy: keys.slice(-days).map(k => parseFloat((dayMap[k].loadPwr / Math.max(1, dayMap[k].count) * 0.083).toFixed(2))),
  };
}

/**
 * Build runtime summary (battery ON hrs, gen ON hrs) from historical data.
 * Estimated from energy amounts ÷ rated power.
 */
function buildRuntimeSummary(histData, batCapacity = 5, pvCapacity = 5, days = 30) {
  if (!histData) return { battery_hrs: 0, generator_hrs: 0, ratio: 0, battery_pct: 0 };

  const esDischarge = parseFloat(histData.esDischarging ?? 0); // kWh
  const pvGen       = parseFloat(histData.powerGeneration ?? 0); // kWh

  const ratedBatPower = Math.max(1, batCapacity);    // kW rated discharge
  const ratedPvPower  = Math.max(1, pvCapacity);     // kW peak PV

  const battHrs = parseFloat((esDischarge / ratedBatPower).toFixed(1));
  const genHrs  = parseFloat((pvGen / ratedPvPower).toFixed(1));
  const total   = battHrs + genHrs;

  return {
    battery_hrs:  battHrs,
    generator_hrs: genHrs,
    ratio:        total > 0 ? parseFloat((battHrs / Math.max(0.01, genHrs)).toFixed(2)) : 0,
    battery_pct:  total > 0 ? Math.round(battHrs / total * 100) : 0,
  };
}

module.exports = {
  transformEnergyFlow,
  transformSystemList,
  transformHistory,
  buildRuntimeSummary,
};
