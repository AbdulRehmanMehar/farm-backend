const express = require('express');
const store = require('../data/store');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all farms for user
router.get('/', authMiddleware, (req, res) => {
  const farms = store.farms.filter(f => f.userId === req.userId);
  res.json(farms);
});

// Get single farm
router.get('/:id', authMiddleware, (req, res) => {
  const farm = store.farms.find(
    f => f.id === req.params.id && f.userId === req.userId
  );
  
  if (!farm) {
    return res.status(404).json({ error: 'Farm not found' });
  }
  
  res.json(farm);
});

// Create farm
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, address, latitude, longitude, timezone } = req.body;

    const newFarm = {
      id: String(store.farms.length + 1),
      userId: req.userId,
      name,
      address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timezone: timezone || 'America/New_York',
      createdAt: new Date()
    };

    store.farms.push(newFarm);
    res.status(201).json(newFarm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update farm
router.put('/:id', authMiddleware, (req, res) => {
  const farmIndex = store.farms.findIndex(
    f => f.id === req.params.id && f.userId === req.userId
  );

  if (farmIndex === -1) {
    return res.status(404).json({ error: 'Farm not found' });
  }

  const { name, address, latitude, longitude, timezone } = req.body;
  
  store.farms[farmIndex] = {
    ...store.farms[farmIndex],
    name: name || store.farms[farmIndex].name,
    address: address || store.farms[farmIndex].address,
    latitude: latitude ? parseFloat(latitude) : store.farms[farmIndex].latitude,
    longitude: longitude ? parseFloat(longitude) : store.farms[farmIndex].longitude,
    timezone: timezone || store.farms[farmIndex].timezone
  };

  res.json(store.farms[farmIndex]);
});

// Delete farm
router.delete('/:id', authMiddleware, (req, res) => {
  const farmIndex = store.farms.findIndex(
    f => f.id === req.params.id && f.userId === req.userId
  );

  if (farmIndex === -1) {
    return res.status(404).json({ error: 'Farm not found' });
  }

  store.farms.splice(farmIndex, 1);
  
  // Delete associated rules
  store.rules = store.rules.filter(r => r.farmId !== req.params.id);
  
  res.json({ message: 'Farm deleted successfully' });
});

module.exports = router;
