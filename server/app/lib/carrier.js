import logger from 'logops';
import { international as phoneFormat } from './phone';
import { ov_config } from './ov_config';

const client = require('twilio')(ov_config.twilio_account_sid, ov_config.twilio_auth_token, { 
    lazyLoading: true 
});

module.exports = (phone, callback) => {
  logger.debug(`Checking carrier for ${phoneFormat(phone)}`);

  if (ov_config.twilio_disable) {
    logger.debug('Bypassing carrier lookup');
    return;
  }

  return client.lookups.phoneNumbers(phoneFormat(phone))
    .fetch({type:['carrier']})
};
