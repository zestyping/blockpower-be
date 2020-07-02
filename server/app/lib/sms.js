const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, { 
    lazyLoading: true 
});

module.exports = (to, message) => {
  return client.messages.create({from: process.env.TWILIO_FROM, to: to, body: message});
};