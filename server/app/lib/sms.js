import logger from 'logops';
import { international as phoneFormat } from './phone';
import { ov_config } from './ov_config';
import { carrier } from './carrier';

const client = require('twilio')(ov_config.twilio_account_sid, ov_config.twilio_auth_token, { 
    lazyLoading: true 
});

module.exports = (to, message) => {
  logger.debug(`Sending SMS to ${phoneFormat(to)}: ${message}`);

  if (ov_config.twilio_disable) {
    logger.debug('Bypassing sending SMS');
    return;
  }

  try {
    let lookup = await carrier(to);
    let blockedCarriers = ov_config.blocked_carriers
    let blockTest = new RegExp( blockedCarriers.join("|"), "i");
    let isBlocked = blockTest.test(lookup.carrier.name);
    if(isBlocked) {
      logger.info(`Blocked sending message to ${phoneFormat(to)} because carrier ${lookup.carrier.name} is blocked in config`);
      throw `Blocked sending message to ${phoneFormat(to)} because carrier ${lookup.carrier.name} is blocked in config`;
    }
  } catch(err) {
    logger.info(`Won't send SMS because ${err}`)
  }

  return client.messages.create({from: ov_config.twilio_from, to: phoneFormat(to), body: message});
};
