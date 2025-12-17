const axios = require('axios');

const fetchAQI = async (lat, lng) => {
  const { WAQI_API_TOKEN } = process.env;

  if (!WAQI_API_TOKEN) {
    throw new Error('Missing WAQI_API_TOKEN environment variable.');
  }

  const endpoint = `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${WAQI_API_TOKEN}`;
  const { data: payload } = await axios.get(endpoint);

  if (payload.status !== 'ok' || !payload.data) {
    throw new Error('WAQI API returned an error payload.');
  }

  const { aqi = null, city = {}, iaqi = {}, dominentpol = null } = payload.data;
  const pm25 = iaqi?.pm25?.v ?? aqi ?? null;

  return {
    aqi,
    city: city?.name ?? null,
    pm25,
    dominantPol: dominentpol ?? null,
  };
};

module.exports = { fetchAQI };
