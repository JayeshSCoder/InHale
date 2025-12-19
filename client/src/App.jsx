import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import './styles/global.css';

const FALLBACK_COORDS = { lat: 40.7128, lng: -74.0060 };

const fullScreenStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'var(--bg-dark)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-main)',
  padding: '2rem',
};

const FullScreenLoader = () => (
  <div style={fullScreenStyle}>
    <div className="glass" style={{ padding: '2rem 3rem', textAlign: 'center' }}>
      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Calibrating your air-quality insights…</p>
    </div>
  </div>
);

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const userRef = useRef(null);
  const lastCoordsRef = useRef(FALLBACK_COORDS);
  const [lastCheckTime, setLastCheckTime] = useState(null);

  useEffect(() => {
    if (user) {
      userRef.current = user;
    } else {
      userRef.current = null;
    }
  }, [user]);

  useEffect(() => {
    if (typeof Notification === 'undefined' || typeof Notification.requestPermission !== 'function') {
      return;
    }

    Notification.requestPermission().catch(() => {
      /* ignored */
    });

  }, []);

  const getFreshCoordinates = () =>
    new Promise((resolve) => {
      const fallbackCoords = lastCoordsRef.current ?? FALLBACK_COORDS;

      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve(fallbackCoords);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const freshCoords = {
            lat: coords.latitude,
            lng: coords.longitude,
          };
          lastCoordsRef.current = freshCoords;
          resolve(freshCoords);
        },
        (geoError) => {
          console.warn('Geolocation lookup failed, using last known coordinates.', geoError);
          resolve(fallbackCoords);
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
      );
    });

  const playAlertTone = () => {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        return;
      }
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 660;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.4);
    } catch (audioError) {
      console.warn('Notification audio cue failed:', audioError);
    }
  };

  useEffect(() => {
    if (!user) {
      userRef.current = null;
      return undefined;
    }

    userRef.current = user;

    const intervalId = setInterval(() => {
      const runCheck = async () => {
        if (!userRef.current) {
          return;
        }

        try {
          const coords = await getFreshCoordinates();
          const { data } = await axios.get('/api/aqi', {
            params: coords,
            withCredentials: true,
          });
          setLastCheckTime(new Date().toLocaleTimeString());

          const aqi = Number(data?.aqi ?? 0);
          const threshold = Number(userRef.current?.aqiThreshold ?? 0);
          const rawInterval = userRef.current?.notificationInterval || 1;
          const unit = userRef.current?.notificationUnit || 'hours';
          const requiredMinutes = unit === 'hours' ? rawInterval * 60 : rawInterval;
          const lastTime = userRef.current?.lastNotifiedAt
            ? new Date(userRef.current.lastNotifiedAt).getTime()
            : 0;
          const now = Date.now();
          const elapsedMinutes = (now - lastTime) / (1000 * 60);

          if (elapsedMinutes >= requiredMinutes && aqi > threshold) {
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification(`InHale Alert`, {
                body: `⚠️ Air Alert: AQI ${aqi} - Breathing this is like smoking ${(aqi / 22).toFixed(1)} cigarettes.`,
                icon: '/vite.svg',
              });
            }

            userRef.current.lastNotifiedAt = new Date().toISOString();
          }
        } catch (error) {
          console.error('Background AQI check failed:', error);
        }
      };

      runCheck();
    }, 10_000);

    return () => clearInterval(intervalId);
  }, [user]);

  if (loading) {
    return <FullScreenLoader />;
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route
          path="/"
          element={user ? <Dashboard user={user} lastCheck={lastCheckTime} /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
