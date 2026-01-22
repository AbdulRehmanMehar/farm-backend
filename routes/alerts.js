const express = require('express');
const store = require('../data/store');
const authMiddleware = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');

const router = express.Router();

// Send alert email
router.post('/send-email', authMiddleware, async (req, res) => {
  const { alertId, email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const alert = store.alerts.find(a => a.id === alertId && a.userId === req.userId);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  // Get related data for rich email content
  const farm = store.farms.find(f => f.id === alert.farmId);
  const rule = store.rules.find(r => r.id === alert.ruleId);

  const subject = `🚨 Farm Alert: ${rule ? rule.name : 'Alert'} - ${farm ? farm.name : 'Farm'}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #dc2626; border-bottom: 2px solid #fee2e2; padding-bottom: 10px;">🚨 New Farm Alert</h2>
      
      <div style="margin: 20px 0;">
        <p><strong>Farm:</strong> ${farm ? farm.name : 'Unknown Farm'}</p>
        <p><strong>Rule:</strong> ${rule ? rule.name : 'Unknown Rule'}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Time:</strong> ${new Date(alert.createdAt).toLocaleString()}</p>
        
        ${alert.weatherData ? `
          <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-top: 15px;">
            <p style="margin: 5px 0;"><strong>Duration:</strong> ${alert.weatherData.duration?.toFixed(1)} hours</p>
          </div>
        ` : ''}
      </div>
      
      <p style="color: #64748b; font-size: 12px; margin-top: 30px;">
        Sent from your Farm Weather Alert System
      </p>
    </div>
  `;

  const result = await sendEmail(
    email,
    subject,
    `Alert: ${alert.message}`, // Fallback plain text
    htmlContent
  );

  if (result.success) {
    res.json({ success: true, message: 'Email sent successfully' });
  } else {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Get all alerts for user
router.get('/', authMiddleware, (req, res) => {
  const alerts = store.alerts
    .filter(a => a.userId === req.userId)
    .sort((a, b) => b.createdAt - a.createdAt);
  
  res.json(alerts);
});

// Get alerts for specific farm
router.get('/farm/:farmId', authMiddleware, (req, res) => {
  const alerts = store.alerts
    .filter(a => a.farmId === req.params.farmId && a.userId === req.userId)
    .sort((a, b) => b.createdAt - a.createdAt);
  
  res.json(alerts);
});

// Get alert statistics
router.get('/stats/summary', authMiddleware, (req, res) => {
  const userAlerts = store.alerts.filter(a => a.userId === req.userId);
  
  const stats = {
    total: userAlerts.length,
    last24h: userAlerts.filter(a => {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return new Date(a.createdAt) > dayAgo;
    }).length,
    last7days: userAlerts.filter(a => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(a.createdAt) > weekAgo;
    }).length,
    byStatus: {
      sent: userAlerts.filter(a => a.status === 'sent').length,
      pending: userAlerts.filter(a => a.status === 'pending').length,
      failed: userAlerts.filter(a => a.status === 'failed').length
    }
  };
  
  res.json(stats);
});

module.exports = router;
