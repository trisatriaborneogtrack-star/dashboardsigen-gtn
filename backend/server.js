require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');

const vesselsRoute  = require('./routes/vessels');
const realtimeRoute = require('./routes/realtime');
const historyRoute  = require('./routes/history');
const locationRoute = require('./routes/location');

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Rate limiting — mirror Sigenergy's 10 req/min per account limit
const limiter = rateLimit({
  windowMs: 60_000,
  max:      60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: 'Rate limit exceeded. Please slow down requests.' },
});
app.use('/api', limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/vessels',  vesselsRoute);
app.use('/api/realtime', realtimeRoute);
app.use('/api/history',  historyRoute);
app.use('/api/location', locationRoute);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }));

// 404
app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// Error handler
app.use((err, req, res, _next) => {
  console.error('[Unhandled]', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⚡ Energy Dashboard Backend — port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Vessels: http://localhost:${PORT}/api/vessels\n`);
  if (!process.env.SIGEN_APP_KEY) {
    console.warn('  ⚠  SIGEN_APP_KEY not set — API calls will fail until configured.\n');
  }
});

module.exports = app;
