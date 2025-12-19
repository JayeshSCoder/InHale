const express = require('express');
const User = require('../models/User');

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

const sanitizeLocationPreference = (preference = {}) => {
  if (!preference || typeof preference !== 'object') {
    return undefined;
  }

  const allowedModes = ['gps', 'manual'];
  const mode = allowedModes.includes(preference.mode) ? preference.mode : 'gps';
  const manualLat = Number(preference.manualLat) || 0;
  const manualLng = Number(preference.manualLng) || 0;

  return {
    mode,
    manualName: preference.manualName ?? '',
    manualLat,
    manualLng,
  };
};

router.post('/update-settings', requireAuth, async (req, res) => {
  const { aqiThreshold, notificationInterval, notificationUnit, locationPreference } = req.body;

  const updatePayload = {};

  if (typeof aqiThreshold === 'number') {
    updatePayload.aqiThreshold = aqiThreshold;
  }

  if (typeof notificationInterval === 'number') {
    updatePayload.notificationInterval = notificationInterval;
  }

  if (typeof notificationUnit === 'string') {
    updatePayload.notificationUnit = notificationUnit;
  }

  const sanitizedLocationPreference = sanitizeLocationPreference(locationPreference);
  if (sanitizedLocationPreference) {
    updatePayload.locationPreference = sanitizedLocationPreference;
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      updatePayload,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.send(updatedUser);
  } catch (error) {
    console.error('Failed to update user settings:', error.message);
    res.status(500).json({ error: 'Unable to update user settings.' });
  }
});

module.exports = router;
