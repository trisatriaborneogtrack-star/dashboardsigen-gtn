const express = require('express');
const router = express.Router();
const sigenAPI = require('../services/sigenAPI');
const { transformSystemList } = require('../services/transform');

// GET /api/vessels
// Returns all onboarded power stations
router.get('/', async (req, res) => {
  try {
    const records = await sigenAPI.getSystemList();
    const vessels = transformSystemList(records);
    res.json({ success: true, data: vessels });
  } catch (err) {
    console.error('[GET /api/vessels]', err.message);
    res.status(502).json({ success: false, error: err.message });
  }
});

module.exports = router;
