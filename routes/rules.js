const express = require('express');
const store = require('../data/store');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all rules for user
router.get('/', authMiddleware, (req, res) => {
  const rules = store.rules.filter(r => r.userId === req.userId);
  res.json(rules);
});

// Get rules for specific farm
router.get('/farm/:farmId', authMiddleware, (req, res) => {
  const rules = store.rules.filter(
    r => r.farmId === req.params.farmId && r.userId === req.userId
  );
  res.json(rules);
});

// Get single rule
router.get('/:id', authMiddleware, (req, res) => {
  const rule = store.rules.find(
    r => r.id === req.params.id && r.userId === req.userId
  );
  
  if (!rule) {
    return res.status(404).json({ error: 'Rule not found' });
  }
  
  res.json(rule);
});

// Create rule
router.post('/', authMiddleware, (req, res) => {
  try {
    const {
      farmId,
      name,
      cropType,
      condition,
      operator,
      threshold,
      duration,
      forecastWindow,
      unit
    } = req.body;

    // Verify farm belongs to user
    const farm = store.farms.find(
      f => f.id === farmId && f.userId === req.userId
    );

    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const newRule = {
      id: String(store.rules.length + 1),
      userId: req.userId,
      farmId,
      name,
      cropType: cropType || 'custom',
      condition,
      operator,
      threshold: parseFloat(threshold),
      duration: parseFloat(duration),
      forecastWindow: parseFloat(forecastWindow),
      unit,
      active: true,
      createdAt: new Date()
    };

    store.rules.push(newRule);
    res.status(201).json(newRule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update rule
router.put('/:id', authMiddleware, (req, res) => {
  const ruleIndex = store.rules.findIndex(
    r => r.id === req.params.id && r.userId === req.userId
  );

  if (ruleIndex === -1) {
    return res.status(404).json({ error: 'Rule not found' });
  }

  const updates = req.body;
  store.rules[ruleIndex] = {
    ...store.rules[ruleIndex],
    ...updates,
    id: store.rules[ruleIndex].id,
    userId: store.rules[ruleIndex].userId,
    createdAt: store.rules[ruleIndex].createdAt
  };

  res.json(store.rules[ruleIndex]);
});

// Toggle rule active status
router.patch('/:id/toggle', authMiddleware, (req, res) => {
  const ruleIndex = store.rules.findIndex(
    r => r.id === req.params.id && r.userId === req.userId
  );

  if (ruleIndex === -1) {
    return res.status(404).json({ error: 'Rule not found' });
  }

  store.rules[ruleIndex].active = !store.rules[ruleIndex].active;
  res.json(store.rules[ruleIndex]);
});

// Delete rule
router.delete('/:id', authMiddleware, (req, res) => {
  const ruleIndex = store.rules.findIndex(
    r => r.id === req.params.id && r.userId === req.userId
  );

  if (ruleIndex === -1) {
    return res.status(404).json({ error: 'Rule not found' });
  }

  store.rules.splice(ruleIndex, 1);
  res.json({ message: 'Rule deleted successfully' });
});

// Get preset templates
router.get('/presets/templates', (req, res) => {
  const presets = [
    {
      id: 'wheat_wind',
      name: 'Wheat High Wind Protection',
      cropType: 'wheat',
      description: 'Alert for sustained high winds that can cause lodging',
      condition: 'wind_speed',
      operator: '>',
      threshold: 30,
      duration: 4,
      forecastWindow: 48,
      unit: 'km/h'
    },
    {
      id: 'corn_frost',
      name: 'Corn Frost Alert',
      cropType: 'corn',
      description: 'Early warning for frost conditions',
      condition: 'temperature',
      operator: '<',
      threshold: 0,
      duration: 2,
      forecastWindow: 72,
      unit: '°C'
    },
    {
      id: 'tomato_heat',
      name: 'Tomato Heat Stress',
      cropType: 'tomato',
      description: 'Alert for prolonged high temperatures',
      condition: 'temperature',
      operator: '>',
      threshold: 35,
      duration: 6,
      forecastWindow: 48,
      unit: '°C'
    },
    {
      id: 'grape_rain',
      name: 'Grape Harvest Rain Warning',
      cropType: 'grape',
      description: 'Heavy rain before harvest can cause fruit splitting',
      condition: 'precipitation',
      operator: '>',
      threshold: 20,
      duration: 12,
      forecastWindow: 72,
      unit: 'mm'
    }
  ];

  res.json(presets);
});

module.exports = router;
