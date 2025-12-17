const normalizeBaseUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const FALLBACK_BASE_URL = 'http://localhost:5000';

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) ?? FALLBACK_BASE_URL;
