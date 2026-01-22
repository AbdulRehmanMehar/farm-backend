const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const farmRoutes = require('./routes/farms');
const ruleRoutes = require('./routes/rules');
const alertRoutes = require('./routes/alerts');
const weatherEngine = require('./services/weatherEngine');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/alerts', alertRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Schedule weather checks every 15 minutes (in production, optimize based on needs)
cron.schedule('*/15 * * * *', () => {
  console.log('Running weather evaluation...');
  weatherEngine.evaluateAllRules();
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Weather engine scheduled for every 15 minutes`);
});
