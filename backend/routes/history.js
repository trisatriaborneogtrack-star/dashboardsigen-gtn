const express = require('express');
const router = express.Router();
const sigenAPI = require('../services/sigenAPI');
const { transformHistory, buildRuntimeSummary } = require('../services/transform');

/**
 * GET /api/history/:systemId
 * Query params:
 *   days=7|14|30   (default 30)
 *   level=Day|Week|Month|Year|Lifetime
 *   date=YYYY-MM-DD
 */
router.get('/:systemId', async (req, res) => {
  const { systemId } = req.params;
  const days  = parseInt(req.query.days  || '30', 10);
  const level = req.query.level || 'Month';
  const date  = req.query.date  || new Date().toISOString().split('T')[0];

  if (!systemId) return res.status(400).json({ success: false, error: 'systemId required' });

  try {
    const [systemListRes, histRes] = await Promise.allSettled([
      sigenAPI.getSystemList(),
      sigenAPI.getSystemHistory(systemId, level, date),
    ]);

    const systems = systemListRes.status === 'fulfilled' ? systemListRes.value : [];
    const system  = systems.find(s => s.systemId === systemId) || {};

    const histData = histRes.status === 'fulfilled' ? histRes.value : null;
    const chartData = transformHistory(histData, days);

    // Build multi-day summary from itemList
    const summary = buildRuntimeSummary(
      histData,
      system.batteryCapacity || 5,
      system.pvCapacity      || 5,
      days
    );

    res.json({
      success: true,
      data: {
        chart: chartData,
        summary,
        raw_totals: {
          power_generation:    histData?.powerGeneration    ?? 0,
          power_to_grid:       histData?.powerToGrid        ?? 0,
          power_self_use:      histData?.powerSelfConsumption ?? 0,
          power_use:           histData?.powerUse           ?? 0,
          power_from_grid:     histData?.powerFromGrid      ?? 0,
          es_charging:         histData?.esCharging         ?? 0,
          es_discharging:      histData?.esDischarging      ?? 0,
        },
      },
    });
  } catch (err) {
    console.error(`[GET /api/history/${systemId}]`, err.message);
    res.status(502).json({ success: false, error: err.message });
  }
});

module.exports = router;
