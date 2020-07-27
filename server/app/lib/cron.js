import cron from 'node-cron';
import payouts from '../background/payouts';

function runOnce() {

}

function schedule() {
  // TODO read from yaml configuration file
  cron.schedule('* * * * *', payouts );
}

module.exports = {
  runOnce: runOnce,
  schedule: schedule
}