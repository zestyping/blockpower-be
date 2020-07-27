import logger from 'logops';

import ambassadorSvc from '../services/ambassadors';
import stripeSvc from '../services/stripe';

async function disburse() {
  logger.debug('Disbursing amount to ambassadors...');

  let ambassadors = await ambassadorSvc.findAmbassadorsWithPendingDisbursements();
  logger.debug('%d ambassadors to be processed', ambassadors.length);

  await Promise.all(ambassadors.map(async(ambassador) => {
    await Promise.all(ambassador.get('earns_off').map(async(relationship) => {
      let tripler = relationship.otherNode();
      try {
        logger.debug('Trying disbursement for ambassador (%s) for tripler (%s)', ambassador.get('phone'), tripler.get('phone'));
        await stripeSvc.disburse(ambassador, tripler);
      }
      catch(err) {
        logger.error('Error sending disbursement for ambassador (%s) for tripler (%s): %s', ambassador.get('phone'), tripler.get('phone'), err);
      }
    }));
  }));
}

async function settle() {
  logger.debug('Settling for ambassadors...');

  let ambassadors = await ambassadorSvc.findAmbassadorsWithPendingSettlements();
  logger.debug('%d ambassadors to be processed', ambassadors.length);

  await Promise.all(ambassadors.map(async(ambassador) => {
    await Promise.all(ambassador.get('earns_off').map(async(relationship) => {
      let tripler = relationship.otherNode();
      try {
        logger.debug('Trying settlement for ambassador (%s) for tripler (%s)', ambassador.get('phone'), tripler.get('phone'));
        await stripeSvc.settle(ambassador, tripler);
      }
      catch(err) {
        logger.error('Error settling for ambassador (%s) for tripler (%s): %s', ambassador.get('phone'), tripler.get('phone'), err);
      }
    }));
  }));
}

module.exports = () => {
  logger.debug('Send payouts/retrying payouts');

  setTimeout(async() => {
    try {
      await disburse();
      await settle();
    } catch(err) {
      logger.error('Error in payouts background job: %s', err);  
    }
  });
}