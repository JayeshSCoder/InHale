const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  CLIENT_ORIGIN = 'http://localhost:5173',
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('Missing Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).');
  process.exit(1);
}

const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          if (!email) {
            return done(new Error('Google account is missing an email address.'));
          }

          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            user = await User.create({
              googleId: profile.id,
              email,
              name: profile.displayName || '',
              picture: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

module.exports = { configurePassport, CLIENT_ORIGIN };
