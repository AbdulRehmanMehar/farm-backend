// In-memory data store for POC (replace with database in production)

const store = {
  users: [
    {
      id: '1',
      email: 'demo@farm.com',
      password: '$2a$10$XQq0LhJHZb6zXZ5Y9h7Z3OKZq5I5cZJ5yZJ5L5K5J5I5K5J5L5K5J', // password: demo123
      name: 'Demo Farmer',
      phone: '+1234567890',
      subscription: 'premium',
      createdAt: new Date('2025-01-01')
    }
  ],
  farms: [
    {
      id: '1',
      userId: '1',
      name: 'North Valley Farm',
      address: '123 Farm Road, Iowa, USA',
      latitude: 42.0308,
      longitude: -93.6319,
      timezone: 'America/Chicago',
      createdAt: new Date('2025-01-02')
    }
  ],
  rules: [
    {
      id: '1',
      userId: '1',
      farmId: '1',
      name: 'High Wind Alert - Wheat',
      cropType: 'wheat',
      condition: 'wind_speed',
      operator: '>',
      threshold: 30,
      duration: 4,
      forecastWindow: 48,
      unit: 'km/h',
      active: true,
      createdAt: new Date('2025-01-03')
    }
  ],
  alerts: [
    {
      id: '1',
      userId: '1',
      farmId: '1',
      ruleId: '1',
      message: 'High wind alert: Wind speed exceeded 30 km/h for 4 hours',
      weatherData: {
        windSpeed: 35,
        duration: 4.5,
        timestamp: new Date('2025-01-15T14:00:00')
      },
      status: 'sent',
      sentAt: new Date('2025-01-15T14:05:00'),
      createdAt: new Date('2025-01-15T14:05:00')
    }
  ],
  weatherCache: {}
};

module.exports = store;
