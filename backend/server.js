const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const uploadRoutes = require('./routes/upload');
const ensRoutes = require('./routes/ens');
const submissionRoutes = require('./routes/submissions');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet());

// CORS
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) || [];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+$/.test(origin)) {
        return callback(null, true);
      }
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Version
const { version } = require('./package.json');
app.get('/version', (req, res) => {
  res.json({ service: 'backend', version });
});

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/ens', ensRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`GovernedMinting backend running on port ${PORT}`);
});
