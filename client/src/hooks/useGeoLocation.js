import { useCallback, useEffect, useState } from 'react';

const DEFAULT_COORDS = { lat: 40.7128, lng: -74.006 };

const GEO_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

const roundCoordinate = (value) => {
  const numericValue = Number.parseFloat(value);
  if (Number.isNaN(numericValue)) {
    return value;
  }
  return Number(numericValue.toFixed(4));
};

const useGeoLocation = () => {
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [status, setStatus] = useState(GEO_STATUS.IDLE);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('fallback');
  const [timestamp, setTimestamp] = useState(null);

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus(GEO_STATUS.ERROR);
      setError('Geolocation is not supported in this browser.');
      setSource('fallback');
      return;
    }

    setStatus(GEO_STATUS.LOADING);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: roundCoordinate(latitude), lng: roundCoordinate(longitude) });
        setStatus(GEO_STATUS.SUCCESS);
        setSource('device');
        setTimestamp(Date.now());
      },
      (geoError) => {
        setError(geoError.message || 'Location permissions were denied. Using fallback coordinates.');
        setStatus(GEO_STATUS.ERROR);
        setSource('fallback');
        setTimestamp(Date.now());
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    coords,
    status,
    error,
    source,
    timestamp,
    requestLocation,
  };
};

export default useGeoLocation;
