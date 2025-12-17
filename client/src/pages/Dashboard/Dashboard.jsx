import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar/Navbar';
import LungViz from '../../components/LungViz/LungViz';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import styles from './Dashboard.module.css';

const FALLBACK_COORDS = { lat: 40.7128, lng: -74.0060 }; // NYC fallback if geolocation fails

const Dashboard = ({ user: propUser, lastCheck }) => {
  const { user: contextUser } = useAuth();
  const user = propUser ?? contextUser;
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [predictionHours, setPredictionHours] = useState(0);

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

    const hydrateDashboard = async () => {
      try {
        const { coords, fallback } = await requestCoordinates();
        if (!isMounted) return;
        setUsingFallback(fallback);

        const response = await axios.get(`${API_BASE_URL}/api/aqi`, {
          params: { lat: coords.lat, lng: coords.lng },
          withCredentials: true,
        });

        if (!isMounted) return;
        setWeatherData(response.data);
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
  }, []);

  const aqiValue = weatherData?.aqi ?? 0;
  const displayedAQI = weatherData ? aqiValue + predictionHours * 15 : 0;
  const pm25Value = weatherData?.pm25 ?? displayedAQI;
  const cityName = weatherData?.city ?? 'Your location';
  const cigs = weatherData ? Math.ceil((displayedAQI / 22) * 10) / 10 : null;
  const cigsDisplay = cigs !== null ? cigs.toFixed(1) : '--';
  const adviceCopy = displayedAQI > 150 ? 'Predicted hazardous levels. Limit outdoor exposure.' : 'Future air still manageable, but stay alert.';

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
          <p className={styles.panelSubtitle}>{cityName}</p>
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
      <Navbar user={user} />
      <main className={styles.container}>
        {usingFallback && !loading && !error && (
          <p className={styles.fallbackNotice}>Using default location (GPS failed).</p>
        )}
        {content}
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
