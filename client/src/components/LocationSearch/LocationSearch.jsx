import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { searchCity } from '../../services/aqiService';
import styles from './LocationSearch.module.css';

const DEFAULT_MANUAL_FIELDS = {
  manualName: '',
  manualLat: 0,
  manualLng: 0,
};

const LocationSearch = ({ onLocationSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setDropdownOpen(false);
      setIsSearching(false);
      return undefined;
    }

    setIsSearching(true);
    setErrorMessage('');
    clearTimeout(debounceRef.current);
    let cancelled = false;

    debounceRef.current = setTimeout(async () => {
      try {
        const stations = await searchCity(query.trim());
        if (cancelled) {
          return;
        }
        setResults(stations);
        setDropdownOpen(stations.length > 0);
      } catch (searchError) {
        if (cancelled) {
          return;
        }
        console.error('Location search failed:', searchError);
        setResults([]);
        setDropdownOpen(false);
        setErrorMessage('Unable to search locations right now.');
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(debounceRef.current);
    };
  }, [query]);

  const persistLocationPreference = async (preference) => {
    setIsSaving(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user/update-settings`,
        { locationPreference: preference },
        { withCredentials: true }
      );
      if (typeof onLocationSelect === 'function') {
        await Promise.resolve(onLocationSelect(response?.data));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const extractGeo = (station) => {
    const rawGeo = Array.isArray(station?.station?.geo)
      ? station.station.geo
      : Array.isArray(station?.geo)
        ? station.geo
        : null;

    if (!rawGeo || rawGeo.length < 2) {
      return null;
    }

    const lat = Number(rawGeo[0]);
    const lng = Number(rawGeo[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { lat, lng };
  };

  const handleStationClick = async (station) => {
    const coords = extractGeo(station);
    if (!coords) {
      setErrorMessage('Selected station is missing coordinates.');
      return;
    }

    const stationName = station?.station?.name ?? station?.name ?? 'Saved location';

    try {
      await persistLocationPreference({
        mode: 'manual',
        manualName: stationName,
        manualLat: coords.lat,
        manualLng: coords.lng,
      });
      setQuery(stationName);
      setResults([]);
      setDropdownOpen(false);
      setErrorMessage('');
    } catch (saveError) {
      console.error('Unable to save manual location:', saveError);
      setErrorMessage('Unable to save this location. Please try again.');
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      await persistLocationPreference({ mode: 'gps', ...DEFAULT_MANUAL_FIELDS });
      setQuery('');
      setResults([]);
      setDropdownOpen(false);
      setErrorMessage('');
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            /* prompt user */
          },
          () => {
            /* swallow */
          }
        );
      }
    } catch (error) {
      console.error('Unable to switch to GPS mode:', error);
      setErrorMessage('Unable to switch back to your current location.');
    }
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.fieldGroup}>
        <input
          className={styles.input}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Location"
          onFocus={() => results.length > 0 && setDropdownOpen(true)}
          disabled={isSaving}
        />
        {isSearching && <span className={styles.spinner} aria-hidden="true" />}
      </div>

      {isDropdownOpen && (
        <div className={styles.dropdown}>
          {results.length === 0 && !isSearching ? (
            <p className={styles.emptyState}>No stations found.</p>
          ) : (
            <ul>
              {results.map((station) => {
                const key = `${station?.uid ?? station?.station?.name ?? station?.name ?? Math.random()}`;
                const name = station?.station?.name ?? station?.name ?? 'Unknown station';
                const country = station?.station?.country ?? station?.country ?? '';
                return (
                  <li key={key}>
                    <button
                      type="button"
                      className={styles.dropdownItem}
                      onClick={() => handleStationClick(station)}
                      disabled={isSaving}
                    >
                      <span className={styles.dropdownName}>{name}</span>
                      {country && <span className={styles.dropdownMeta}>{country}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <button
        type="button"
        className={styles.helperButton}
        onClick={handleUseCurrentLocation}
        disabled={isSaving}
      >
        📍 Use My Current Location
      </button>
    </div>
  );
};

export default LocationSearch;
