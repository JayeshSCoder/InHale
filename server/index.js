const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieSession = require('cookie-session');
const passport = require('passport');

dotenv.config();

const { configurePassport, CLIENT_ORIGIN } = require('./config/passport');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const { fetchAQI } = require('./services/aqiService');
const { getHealthAdvice } = require('./services/geminiService');
const User = require('./models/User');

const { MONGODB_URI, COOKIE_SESSION_SECRET = 'insecure_dev_secret', PORT = 5000 } = process.env;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI environment variable.');
  process.exit(1);
}

mongoose.set('strictQuery', true);

const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('error', (error) => {
  console.error('MongoDB encountered an error:', error.message);
});

const app = express();

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(
  cookieSession({
    name: 'session',
    keys: [COOKIE_SESSION_SECRET],
    maxAge: 30 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  })
);


app.use(function(req, res, next) {
    if (req.session && !req.session.regenerate) {
        req.session.regenerate = (cb) => {
            cb();
        };
    }
    if (req.session && !req.session.save) {
        req.session.save = (cb) => {
            cb();
        };
    }
    next();
});

app.use(passport.initialize());
app.use(passport.session());
app.locals.models = { User };
configurePassport();

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.use('/auth', authRoutes);
app.get('/api/aqi', async (req, res) => {
  const { lat, lng } = req.query;
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    return res.status(400).json({ error: 'Valid lat and lng query parameters are required.' });
  }

  try {
    const data = await fetchAQI(parsedLat, parsedLng);
    res.json(data);
  } catch (error) {
    console.error('Failed to retrieve AQI data:', error.message);
    res.status(502).json({ error: 'Unable to fetch AQI data at this time.' });
  }
});

app.get('/api/advice', async (req, res) => {
  const { aqi, city = 'your area', pollutant = 'PM2.5' } = req.query;

  try {
    const advice = await getHealthAdvice(aqi, city, pollutant);
    res.json({ advice });
  } catch (error) {
    console.error('Failed to generate AI advice:', error.message);
    res.json({ advice: 'Monitor AQI closely and adjust outdoor exposure accordingly.' });
  }
});
app.use('/api/user', userRoutes);

const startServer = async () => {
  await connectToDatabase();

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

startServer();
