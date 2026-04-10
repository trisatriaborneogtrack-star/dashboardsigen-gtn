const express = require('express');
const router = express.Router();
const sigenAPI = require('../services/sigenAPI');

/**
 * GET /api/location/:systemId
 * Returns GPS/address data extracted from the system record.
 *
 * NOTE: Sigenergy API returns `addr` (street address string) not lat/lng.
 * Coordinates must be geocoded or pre-configured via env / user input.
 * If GEOCODE_API_KEY is set, we attempt Google Geocoding.
 */
router.get('/:systemId', async (req, res) => {
  const { systemId } = req.params;

  try {
    const systems = await sigenAPI.getSystemList();
    const system  = systems.find(s => s.systemId === systemId);

    if (!system) {
      return res.status(404).json({ success: false, error: 'System not found' });
    }

    // Try to geocode address if API key provided
    let lat = null;
    let lng = null;

    if (system.addr && process.env.GEOCODE_API_KEY) {
      try {
        const { default: axios } = await import('axios');
        const geoRes = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
          params: { address: system.addr, key: process.env.GEOCODE_API_KEY },
          timeout: 5000,
        });
        const loc = geoRes.data?.results?.[0]?.geometry?.location;
        if (loc) { lat = loc.lat; lng = loc.lng; }
      } catch (_) {
        // Geocoding failed — fall through with nulls
      }
    }

    res.json({
      success: true,
      data: {
        system_id:    system.systemId,
        name:         system.systemName || system.name,
        address:      system.addr || '',
        timezone:     system.timeZone || 'UTC',
        status:       system.status,
        on_grid:      system.onOffGridStatus === 'onGrid' || system.onOffGridStatus === 'on',
        lat,
        lng,
      },
    });
  } catch (err) {
    console.error(`[GET /api/location/${systemId}]`, err.message);
    res.status(502).json({ success: false, error: err.message });
  }
});

module.exports = router;
