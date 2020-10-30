import logger from 'logops';
import format from 'string-format';
import sms from '../lib/sms';
import fifo from '../lib/fifo';
import triplerSvc from '../services/triplers';
import { ov_config } from '../lib/ov_config';

async function sms_task(tripler, ambassador) {
  try {
      await sms(tripler.get('phone'), format(ov_config.tripler_upgrade_message,
                                       {
                                         tripler_first_name: tripler.get('first_name'),
                                         ambassador_first_name: ambassador.get('first_name'),
                                         wordpress_landing: ov_config.wordpress_landing
                                       }));
      await tripler.update({upgrade_sms_sent: true});
  } catch (err) {
    logger.error("Unhandled error sending upgrade SMS: %s", err);
  }
}

async function sendSMS() {
  let triplers = await triplerSvc.findRecentlyConfirmedTriplers();
  logger.debug('Preparing to SMS recently confirmed triplers...');
  logger.debug('%d triplers to be processed for sending SMS', triplers.length);

  await Promise.all(triplers.map(async(tripler) => {
    let waiting_period = 60 * ov_config.upgrade_sms_waiting_period; // in minutes
    let confirmed_at = new Date(tripler.get('confirmed_at').toString());
    let delta = (new Date() - confirmed_at) / 1000;
    if (delta > waiting_period) {
      let ambassador = tripler.get('claimed');
      fifo.add(await sms_task(tripler, ambassador));
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

