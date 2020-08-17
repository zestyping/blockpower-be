import logger from 'logops';
import format from 'string-format';
import sms from '../lib/sms';
import triplerSvc from '../services/triplers';
import { ov_config } from '../lib/ov_config';

async function sendSMS() {
  logger.debug('Sending SMS for recently confirmed triplers...');

  let triplers = await triplerSvc.findRecentlyConfirmedTriplers();
  logger.debug('%d triplers to be processed', triplers.length);

  await Promise.all(triplers.map(async(tripler) => {
    let ambassador = tripler.get('claimed');
    try {
      await sms(tripler.get('phone'), format(ov_config.tripler_upgrade_message,
                                       {
                                         tripler_first_name: tripler.get('first_name'),
                                         ambassador_first_name: ambassador.get('first_name'),
                                         ambassador_landing_page: ov_config.ambassador_landing_page
                                       }));
      await tripler.update({upgrade_sms_sent: true});
    } catch (err) {
      logger.error("Unhandled error sending upgrade SMS: %s", err);
    }
  }));
}

module.exports = () => {
  logger.debug('Sending tripler upgrade SMS');

  setTimeout(async() => {
    try {
      await sendSMS();
    } catch(err) {
      logger.error('Error in tripler upgrade SMS background job: %s', err);  
    }
  });
}

