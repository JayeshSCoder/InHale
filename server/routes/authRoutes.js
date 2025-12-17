const express = require('express');
const passport = require('passport');
const { CLIENT_ORIGIN } = require('../config/passport');

const router = express.Router();

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: CLIENT_ORIGIN }),
  (req, res) => {
    res.redirect(CLIENT_ORIGIN);
  }
);

router.get('/status', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ authenticated: false });
  }

  const {
    id,
    _id,
    googleId,
    displayName,
    name,
    email,
    picture,
    image,
    aqiThreshold = 150,
    notificationInterval = 120,
    notificationUnit = 'hours',
    lastNotifiedAt = null,
  } = req.user;

  res.json({
    authenticated: true,
    user: {
      id: id ?? _id,
      googleId,
      name: displayName ?? name,
      displayName: displayName ?? name,
      email,
      picture: picture ?? image,
      image: image ?? picture,
      aqiThreshold,
      notificationInterval,
      notificationUnit,
      lastNotifiedAt,
    },
  });
});

router.post('/logout', (req, res) => {
  const finish = () => {
    req.session = null;
    try {
      res.clearCookie('session');
    } catch (clearError) {
      // ignore cookie clearing errors
    }
    res.json({ success: true });
  };

  if (typeof req.logout === 'function') {
    req.logout((error) => {
      if (error) {
        console.error('Logout failed:', error);
        return res.status(500).json({ error: 'Logout failed.' });
      }
      finish();
    });
  } else {
    finish();
  }
});

router.get('/api/current_user', (req, res) => {
  if (req.user) {
    return res.send(req.user);
  }
  return res.send(null);
});

module.exports = router;
