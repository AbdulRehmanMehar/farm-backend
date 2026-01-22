// Mock SMS service for POC (integrate with Twilio in production)

class SMSService {
  async sendSMS(phoneNumber, message) {
    // In production, use Twilio:
    // const twilio = require('twilio');
    // const client = twilio(accountSid, authToken);
    // await client.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber
    // });

    // Mock implementation
    console.log('📱 SMS Mock Send:');
    console.log(`   To: ${phoneNumber}`);
    console.log(`   Message: ${message}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      sid: 'mock_' + Date.now(),
      timestamp: new Date()
    };
  }

  async sendBulkSMS(recipients, message) {
    const results = [];
    
    for (const phone of recipients) {
      try {
        const result = await this.sendSMS(phone, message);
        results.push({ phone, success: true, result });
      } catch (error) {
        results.push({ phone, success: false, error: error.message });
      }
    }
    
    return results;
  }
}

module.exports = new SMSService();
