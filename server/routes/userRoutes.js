const express = require('express');
const User = require('../models/User');

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

router.post('/update-settings', requireAuth, async (req, res) => {
  const { aqiThreshold, notificationInterval, notificationUnit } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        aqiThreshold,
        notificationInterval,
        notificationUnit,
      },
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
