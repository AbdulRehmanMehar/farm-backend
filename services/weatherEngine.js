const axios = require('axios');
const store = require('../data/store');
const smsService = require('./smsService');

class WeatherEngine {
  constructor() {
    this.evaluationHistory = [];
  }

  // Mock weather data generator (replace with real API in production)
  async fetchWeatherData(latitude, longitude) {
    // Simulate API call
    const mockData = {
      current: {
        temperature: Math.random() * 30 + 5, // 5-35°C
        wind_speed: Math.random() * 50, // 0-50 km/h
        precipitation: Math.random() * 10, // 0-10 mm
        humidity: Math.random() * 100,
        timestamp: new Date()
      },
      forecast: []
    };

    // Generate 72-hour forecast
    for (let i = 0; i < 72; i++) {
      mockData.forecast.push({
        hour: i,
        temperature: Math.random() * 30 + 5,
        wind_speed: Math.random() * 50,
        precipitation: Math.random() * 10,
        humidity: Math.random() * 100,
        timestamp: new Date(Date.now() + i * 60 * 60 * 1000)
      });
    }

    return mockData;
  }

  // Evaluate a single rule against weather data
  evaluateRule(rule, weatherData, farm) {
    const { condition, operator, threshold, duration, forecastWindow } = rule;
    
    // Get relevant forecast window
    const relevantForecasts = weatherData.forecast.slice(0, forecastWindow);
    
    // Check condition
    let conditionMet = false;
    let consecutiveHours = 0;
    let maxConsecutive = 0;
    let triggerData = null;

    for (const forecast of relevantForecasts) {
      let value;
      
      switch (condition) {
        case 'wind_speed':
          value = forecast.wind_speed;
          break;
        case 'temperature':
          value = forecast.temperature;
          break;
        case 'precipitation':
          value = forecast.precipitation;
          break;
        default:
          value = 0;
      }

      // Check if condition is met
      let met = false;
      switch (operator) {
        case '>':
          met = value > threshold;
          break;
        case '<':
          met = value < threshold;
          break;
        case '>=':
          met = value >= threshold;
          break;
        case '<=':
          met = value <= threshold;
          break;
        case '==':
          met = value === threshold;
          break;
      }

      if (met) {
        consecutiveHours++;
        if (consecutiveHours > maxConsecutive) {
          maxConsecutive = consecutiveHours;
          triggerData = {
            value,
            duration: consecutiveHours,
            timestamp: forecast.timestamp
          };
        }
      } else {
        consecutiveHours = 0;
      }

      // Check if duration threshold is met
      if (maxConsecutive >= duration) {
        conditionMet = true;
        break;
      }
    }

    return {
      triggered: conditionMet,
      data: triggerData,
      rule,
      farm
    };
  }

  // Evaluate all active rules
  async evaluateAllRules() {
    const activeRules = store.rules.filter(r => r.active);
    
    console.log(`Evaluating ${activeRules.length} active rules...`);
    
    for (const rule of activeRules) {
      try {
        // Get farm location
        const farm = store.farms.find(f => f.id === rule.farmId);
        if (!farm) continue;

        // Fetch weather data
        const weatherData = await this.fetchWeatherData(
          farm.latitude,
          farm.longitude
        );

        // Evaluate rule
        const result = this.evaluateRule(rule, weatherData, farm);

        // Log evaluation
        this.evaluationHistory.push({
          ruleId: rule.id,
          farmId: farm.id,
          timestamp: new Date(),
          triggered: result.triggered
        });

        // If triggered, create alert and send SMS
        if (result.triggered) {
          await this.createAlert(result);
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error.message);
      }
    }
  }

  // Create alert and send notification
  async createAlert(result) {
    const { rule, farm, data } = result;
    
    // Check if alert was recently sent (avoid spam)
    const recentAlert = store.alerts.find(a => {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return (
        a.ruleId === rule.id &&
        a.farmId === farm.id &&
        new Date(a.createdAt) > hourAgo
      );
    });

    if (recentAlert) {
      console.log(`Alert recently sent for rule ${rule.id}, skipping`);
      return;
    }

    // Create alert message
    const message = `🚨 ${farm.name}: ${rule.name} - ${rule.condition} ${rule.operator} ${rule.threshold}${rule.unit} for ${data.duration}h`;

    // Create alert record
    const alert = {
      id: String(store.alerts.length + 1),
      userId: rule.userId,
      farmId: farm.id,
      ruleId: rule.id,
      message,
      weatherData: {
        condition: rule.condition,
        value: data.value,
        threshold: rule.threshold,
        duration: data.duration,
        timestamp: data.timestamp
      },
      status: 'pending',
      createdAt: new Date()
    };

    store.alerts.push(alert);

    // Send SMS
    try {
      const user = store.users.find(u => u.id === rule.userId);
      if (user && user.phone) {
        await smsService.sendSMS(user.phone, message);
        alert.status = 'sent';
        alert.sentAt = new Date();
        console.log(`✅ Alert sent for rule ${rule.id}`);
      }
    } catch (error) {
      alert.status = 'failed';
      alert.error = error.message;
      console.error(`❌ Failed to send alert:`, error.message);
    }
  }

  // Get evaluation history
  getEvaluationHistory(limit = 100) {
    return this.evaluationHistory.slice(-limit);
  }
}

module.exports = new WeatherEngine();
