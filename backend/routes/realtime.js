const express = require('express');
const router = express.Router();
const sigenAPI = require('../services/sigenAPI');
const { transformEnergyFlow } = require('../services/transform');

// GET /api/realtime/:systemId
// Returns transformed real-time energy snapshot
router.get('/:systemId', async (req, res) => {
  const { systemId } = req.params;
  if (!systemId) return res.status(400).json({ success: false, error: 'systemId required' });

  try {
    // Fetch energy flow and summary in parallel
    const [flowData, summaryData] = await Promise.allSettled([
      sigenAPI.getEnergyFlow(systemId),
      sigenAPI.getSystemRealtime(systemId),
    ]);

    const flow    = flowData.status    === 'fulfilled' ? flowData.value    : null;
    const summary = summaryData.status === 'fulfilled' ? summaryData.value : {};

    if (!flow) {
      return res.status(502).json({ success: false, error: 'Energy flow data unavailable' });
    }

    const transformed = transformEnergyFlow(flow, summary);
    res.json({ success: true, data: transformed });
  } catch (err) {
    console.error(`[GET /api/realtime/${systemId}]`, err.message);
    res.status(502).json({ success: false, error: err.message });
  }
});

module.exports = router;
