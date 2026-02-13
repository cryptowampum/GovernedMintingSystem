const express = require('express');
const cors = require('cors');
require('dotenv').config();

const uploadRoutes = require('./routes/upload');
const ensRoutes = require('./routes/ens');
const submissionRoutes = require('./routes/submissions');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:5173',
  'http://localhost:5174',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (origin.startsWith('http://localhost:') && process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return callback(null, true);
      if (origin.endsWith('.unicornmini.app') && origin.startsWith('https://')) return callback(null, true);
      if (origin.endsWith('.vercel.app') && origin.startsWith('https://')) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization'],
  })
);

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/ens', ensRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`GovernedMinting backend running on port ${PORT}`);
});
