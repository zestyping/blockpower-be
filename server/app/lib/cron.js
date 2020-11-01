import logger from 'logops';
import cron from 'node-cron';
import payouts from '../background/payouts';
import upgrade_sms from '../background/upgrade_sms';
import { ov_config } from './ov_config';

function runOnce() {

}

function schedule() {
  if (!ov_config.disable_auto_payouts) {
    logger.debug('Scheduling payout cron job: ', ov_config.payout_cron_string);
    cron.schedule(ov_config.payout_cron_string, payouts);
  } else {
    logger.debug('Disable Auto Payouts is: ', ov_config.disable_auto_payouts)
  }

  if (!ov_config.disable_upgrade_sms) {
    logger.debug('Scheduling upgrade sms cron job: ', ov_config.upgrade_sms_cron_string);
    cron.schedule(ov_config.upgrade_sms_cron_string, upgrade_sms);
  } else {
    logger.debug('Disable Upgrade SMS is: ', ov_config.disable_upgrade_sms)
  }
}

module.exports = {
  runOnce: runOnce,
  schedule: schedule
}
