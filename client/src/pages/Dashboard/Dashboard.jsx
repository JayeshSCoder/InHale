import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar/Navbar';
import LungViz from '../../components/LungViz/LungViz';
import LocationSearch from '../../components/LocationSearch/LocationSearch';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import styles from './Dashboard.module.css';

const FALLBACK_COORDS = { lat: 40.7128, lng: -74.0060 }; // NYC fallback if geolocation fails

const Dashboard = ({ user: propUser, lastCheck }) => {
  const { user: contextUser, refreshUser } = useAuth();
  const user = propUser ?? contextUser;
  const locationPreference = user?.locationPreference ?? {
    mode: 'gps',
    manualName: '',
    manualLat: 0,
    manualLng: 0,
  };
  const isManualMode = locationPreference?.mode === 'manual';
  const hasManualCoordinates =
    isManualMode &&
    Number.isFinite(locationPreference?.manualLat) &&
    Number.isFinite(locationPreference?.manualLng) &&
    !(locationPreference.manualLat === 0 && locationPreference.manualLng === 0);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [predictionHours, setPredictionHours] = useState(0);
  const [aiAdvice, setAiAdvice] = useState('Analyzing atmosphere...');

  useEffect(() => {
    let isMounted = true;

    const requestCoordinates = () =>
      new Promise((resolve) => {
        if (!navigator.geolocation) {
          console.warn('Geolocation unavailable; using fallback coordinates.');
          resolve({ coords: FALLBACK_COORDS, fallback: true });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          ({ coords }) =>
            resolve({
              coords: {
                lat: coords.latitude,
                lng: coords.longitude,
              },
              fallback: false,
            }),
          (geoError) => {
            console.warn('Geolocation failed; using fallback coordinates.', geoError);
            resolve({ coords: FALLBACK_COORDS, fallback: true });
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
        );
      });

    const getPreferredCoordinates = async () => {
      if (hasManualCoordinates) {
        return {
          coords: {
            lat: locationPreference.manualLat,
            lng: locationPreference.manualLng,
          },
          fallback: false,
        };
      }

      return requestCoordinates();
    };

    const hydrateDashboard = async () => {
      setLoading(true);
      try {
        const { coords, fallback } = await getPreferredCoordinates();
        if (!isMounted) return;
        setUsingFallback(fallback);

        const response = await axios.get(`${API_BASE_URL}/api/aqi`, {
          params: { lat: coords.lat, lng: coords.lng },
          withCredentials: true,
        });

        if (!isMounted) return;
        setWeatherData(response.data);
        try {
          const adviceResponse = await axios.get('/api/advice', {
            params: {
              aqi: response.data?.aqi,
              city: response.data?.city,
              pollutant: response.data?.dominentpol,
            },
            withCredentials: true,
          });
          if (!isMounted) return;
          setAiAdvice(adviceResponse?.data?.advice ?? 'Breathe consciously and monitor AQI updates.');
        } catch (adviceError) {
          console.error('AI advice fetch failed:', adviceError);
          if (isMounted) {
            setAiAdvice('Wear a mask and limit outdoor activities.');
          }
        }
        setError(null);
      } catch (fetchError) {
        if (isMounted) {
          console.error('AQI fetch failed:', fetchError);
          setError('Could not fetch location or data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    hydrateDashboard();

    return () => {
      isMounted = false;
    };
  }, [hasManualCoordinates, locationPreference?.mode, locationPreference?.manualLat, locationPreference?.manualLng]);

  const handleLocationChange = async () => {
    await refreshUser?.({ silent: true });
  };

  const displayCityName = hasManualCoordinates && locationPreference?.manualName
    ? locationPreference.manualName
    : weatherData?.city ?? 'Your location';

  const aqiValue = weatherData?.aqi ?? 0;
  const displayedAQI = weatherData ? aqiValue + predictionHours * 15 : 0;
  const cigs = weatherData ? Math.ceil((displayedAQI / 22) * 10) / 10 : null;
  const cigsDisplay = cigs !== null ? cigs.toFixed(1) : '--';
  const adviceCopy = displayedAQI > 150 ? 'Predicted hazardous levels. Limit outdoor exposure.' : 'Future air still manageable, but stay alert.';
  const modeLabel = isManualMode ? 'Manual Mode' : 'Current Location';
  const showFallbackNotice = !isManualMode && usingFallback && !loading && !error;

  let content = null;

  if (loading) {
    content = (
      <section className={`${styles.panel} ${styles.statePanel}`}>
        <div className={styles.glassPulse}>
          <p className={styles.statusText}>Loading Glass</p>
        </div>
      </section>
    );
  } else if (error) {
    content = (
      <section className={`${styles.panel} ${styles.errorPanel}`}>
        <p className={styles.errorMessage}>{error}</p>
      </section>
    );
  } else if (weatherData) {
    content = (
      <div className={styles.grid}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Lung Visualization</h2>
          <p className={styles.panelSubtitle}>{displayCityName}</p>
          <LungViz aqi={displayedAQI} />
          <p className={styles.aqiValue}>{displayedAQI}</p>
        </section>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Cigarette Equivalent</h2>
          <p className={styles.panelSubtitle}>Breathing this air for 24h is like smoking...</p>
          <p className={styles.cigValue}>{cigsDisplay}</p>
          <p className={styles.panelSubtitle}>...cigarettes.</p>
          <div className={styles.adviceCard}>
            <p className={styles.adviceTitle}>Health Advice</p>
            <p className={styles.adviceBody}>{adviceCopy}</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <Navbar user={user} onUpdateUser={handleLocationChange} />
      <main className={styles.container}>
        <div className={styles.locationBar}>
          <div className={styles.locationInfo}>
            <p className={styles.locationLabel}>Monitoring</p>
            <div className={styles.locationHeadingRow}>
              <h1 className={styles.locationName}>{displayCityName}</h1>
              <span className={styles.modePill}>{modeLabel}</span>
            </div>
            <p className={styles.locationHint}>
              {isManualMode ? 'Sourcing AQI data for your saved city.' : 'Tracking the air around your current position.'}
            </p>
          </div>
          <LocationSearch onLocationSelect={handleLocationChange} />
        </div>
        {showFallbackNotice && (
          <p className={styles.fallbackNotice}>Using default location (GPS failed).</p>
        )}
        {content}
        {!loading && !error && (
          <section className={`${styles.panel} ${styles.aiPanel}`}>
            <p className={styles.aiTitle}>✨ AI Health Insight</p>
            <p className={styles.aiCopy}>{aiAdvice}</p>
          </section>
        )}
        {!loading && !error && weatherData && (
          <section className={`${styles.panel} ${styles.sliderPanel}`}>
            <h2 className={styles.panelTitle}>Forecast Slider</h2>
            <p className={styles.panelSubtitle}>Predict Air Quality: +{predictionHours} Hours</p>
            <input
              className={styles.rangeInput}
              type="range"
              min="0"
              max="12"
              value={predictionHours}
              onChange={(event) => setPredictionHours(Number(event.target.value))}
            />
          </section>
        )}
        <p
          style={{
            textAlign: 'center',
            opacity: 0.5,
            fontSize: '0.8rem',
            marginTop: '2rem',
          }}
        >
          ⚡ System Monitoring Active. Last Scan: {lastCheck || 'Waiting...'}
        </p>
      </main>
    </div>
  );
};

export default Dashboard;
