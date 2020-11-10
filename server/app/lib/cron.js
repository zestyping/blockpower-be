import cron from 'node-cron';
import payouts from '../background/payouts';
import upgrade_sms from '../background/upgrade_sms';
import { ov_config } from './ov_config';

function runOnce() {

}

/*
 *
 * schedule()
 *
 * This function is called on startup. It sets the node-cron schedule based on .env vars
 * The relevant env vars control whether or not the cron schedule is disabled, and
 *   what the firing schedule is, if not disabled.
 * The functions passed to node-cron are the background modules found in /background
 *
 */
function schedule() {
  if (!ov_config.disable_auto_payouts) {
    console.log('Scheduling payout cron job: ', ov_config.payout_cron_string);
    cron.schedule(ov_config.payout_cron_string, payouts);
  } else {
    console.log('Disable Auto Payouts is: ', ov_config.disable_auto_payouts)
  }

  if (!ov_config.disable_upgrade_sms) {
    console.log('Scheduling upgrade sms cron job: ', ov_config.upgrade_sms_cron_string);
    cron.schedule(ov_config.upgrade_sms_cron_string, upgrade_sms);
  } else {
    console.log('Disable Upgrade SMS is: ', ov_config.disable_upgrade_sms)
  }
}

module.exports = {
  runOnce: runOnce,
  schedule: schedule
}
