const express = require('express');
const { fetchAQI } = require('../services/aqiService');

const router = express.Router();

router.get('/', async (req, res) => {
  const { lat, lng } = req.query;
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    return res.status(400).json({ error: 'Valid lat and lng query parameters are required.' });
  }

  try {
    const data = await fetchAQI(parsedLat, parsedLng);
    res.json(data);
  } catch (error) {
    console.error('Failed to retrieve AQI data:', error.message);
    res.status(502).json({ error: 'Unable to fetch AQI data at this time.' });
  }
});

module.exports = router;
