const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: String,
    displayName: String,
    email: String,
    image: String,
    aqiThreshold: { type: Number, default: 150 },
    notificationInterval: { type: Number, default: 120 },
    notificationUnit: { type: String, enum: ['minutes', 'hours'], default: 'hours' },
    lastNotifiedAt: { type: Date, default: null },
    locationPreference: {
      mode: { type: String, enum: ['gps', 'manual'], default: 'gps' },
      manualName: { type: String, default: '' },
      manualLat: { type: Number, default: 0 },
      manualLng: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('users', userSchema);
