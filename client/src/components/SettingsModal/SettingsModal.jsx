import { useEffect, useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './SettingsModal.module.css';

const SettingsModal = ({ isOpen, onClose, user, onUpdateUser }) => {
  const [threshold, setThreshold] = useState(user?.aqiThreshold ?? 150);
  const [interval, setIntervalValue] = useState(user?.notificationInterval ?? 1);
  const [unit, setUnit] = useState(user?.notificationUnit ?? 'hours');
  const [saving, setSaving] = useState(false);
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (user) {
      setThreshold(user.aqiThreshold ?? 150);
      setIntervalValue(user.notificationInterval ?? 1);
      setUnit(user.notificationUnit ?? 'hours');
    } else {
      setThreshold(150);
      setIntervalValue(1);
      setUnit('hours');
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        aqiThreshold: Number(threshold),
        notificationInterval: Number(interval),
        notificationUnit: unit ?? 'hours',
      };
      const { data } = await axios.post('/api/user/update-settings', payload);
      onUpdateUser?.(data);
      await refreshUser?.({ silent: true });
      onClose();
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Notification Settings</h2>
          <button type="button" onClick={onClose} aria-label="Close settings" className={styles.cancelButton}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="aqi-threshold">
            Danger Threshold (AQI)
          </label>
          <input
            id="aqi-threshold"
            type="number"
            className={styles.input}
            min="0"
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="notification-interval">
            Notification Interval
          </label>
          <div className={styles.inputGroup}>
            <input
              id="notification-interval"
              type="number"
              className={styles.input}
              min="1"
              value={interval}
              onChange={(event) => setIntervalValue(Number(event.target.value))}
            />
            <select
              className={styles.select}
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
            </select>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className={styles.saveButton} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
