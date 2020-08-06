import logger from 'logops';
import cron from 'node-cron';
import payouts from '../background/payouts';
import { ov_config } from './ov_config';

function runOnce() {

}

function schedule() {
  if (!ov_config.disable_auto_payouts) {
    logger.debug('Scheduling payout cron job for every %s minutes', ov_config.payout_schedule);
    cron.schedule(`*/${ov_config.payout_schedule} * * * *`, payouts);
  }
}

module.exports = {
  runOnce: runOnce,
  schedule: schedule
}