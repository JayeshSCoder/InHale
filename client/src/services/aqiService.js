import axios from 'axios';

const WAQI_TOKEN = import.meta.env.VITE_WAQI_TOKEN;

export const searchCity = async (keyword) => {
  const trimmedKeyword = keyword?.trim();

  if (!trimmedKeyword) {
    return [];
  }

  if (!WAQI_TOKEN) {
    console.warn('VITE_WAQI_TOKEN is missing; cannot search for cities.');
    return [];
  }

  try {
    const response = await axios.get('https://api.waqi.info/search/', {
      params: {
        token: WAQI_TOKEN,
        keyword: trimmedKeyword,
      },
    });

    if (response?.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    return [];
  } catch (error) {
    console.error('City search failed:', error.message || error);
    throw error;
  }
};
