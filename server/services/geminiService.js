const { GoogleGenerativeAI } = require('@google/generative-ai');

const { GEMINI_API_KEY } = process.env;

let genAiClient;

const getClient = () => {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  if (!genAiClient) {
    genAiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
  }

  return genAiClient;
};

const truncate = (value, limit) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value.slice(0, limit);
};

const resolveTextResponse = (response) => {
  if (response?.response?.text) {
    return response.response.text();
  }

  if (response?.candidates?.length) {
    const { content } = response.candidates[0];
    if (content?.parts?.length && content.parts[0]?.text) {
      return content.parts[0].text;
    }
  }

  return '';
};

const getHealthAdvice = async (aqi, city, pollutant) => {
  const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });

  const safeCity = truncate(city ?? 'your area', 80) || 'your area';
  const safePollutant = truncate(pollutant ?? 'PM2.5', 80) || 'PM2.5';
  const parsedAQI = Number.isFinite(Number(aqi)) ? Number(aqi) : 0;

  const prompt = `You are a medical health expert. The Air Quality Index (AQI) in ${safeCity} is ${parsedAQI} and the dominant pollutant is ${safePollutant}. Give one single, short, impactful sentence (max 15 words) of specific health advice for right now. Do not be generic. Be urgent if high, calm if low.`;

  const response = await model.generateContent(prompt);
  const advice = resolveTextResponse(response)?.trim();

  return advice || 'Stay aware of current air conditions and adjust outdoor activity accordingly.';
};

module.exports = {
  getHealthAdvice,
};
