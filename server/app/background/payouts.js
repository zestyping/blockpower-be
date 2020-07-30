import logger from 'logops';

import ambassadorSvc from '../services/ambassadors';
import stripeSvc from '../services/stripe';
import fifo from '../lib/fifo';
import triplerSvc from '../services/triplers';

function disburse_task(ambassador, tripler) {
  return {
    name: `Disbursing ambassador: ${ambassador.get('phone')} for tripler: ${tripler.get('phone')}`,
    execute: async () => {
      try {
        logger.debug('Trying disbursement for ambassador (%s) for tripler (%s)', ambassador.get('phone'), tripler.get('phone'));
        await stripeSvc.disburse(ambassador, tripler);
      }
      catch(err) {
        logger.error('Error sending disbursement for ambassador (%s) for tripler (%s): %s', ambassador.get('phone'), tripler.get('phone'), err);
      }
    },
  };
}

function settle_task(ambassador, tripler) {
  return {
    name: `Settle ambassador: ${ambassador.get('phone')} for tripler: ${tripler.get('phone')}`,
    execute: async () => {
      try {
        logger.debug('Trying settlement for ambassador (%s) for tripler (%s)', ambassador.get('phone'), tripler.get('phone'));
        await stripeSvc.settle(ambassador, tripler);
      }
      catch(err) {
        logger.error('Error settling for ambassador (%s) for tripler (%s): %s', ambassador.get('phone'), tripler.get('phone'), err);
      }
    },
  };  
}

async function disburse() {
  logger.debug('Disbursing amount to ambassadors...');

  let ambassadors = await ambassadorSvc.findAmbassadorsWithPendingDisbursements();
  logger.debug('%d ambassadors to be processed', ambassadors.length);

  await Promise.all(ambassadors.map(async(ambassador) => {
    await Promise.all(ambassador.get('gets_paid').map(async(relationship) => {
      let payout = relationship.otherNode();
      if (payout.get('status') === 'pending') {
        let tripler = await triplerSvc.findById(relationship.get('tripler_id'));
        fifo.add(disburse_task(ambassador, tripler));
      }      
    }));
  }));
}

async function settle() {
  logger.debug('Settling for ambassadors...');

  let ambassadors = await ambassadorSvc.findAmbassadorsWithPendingSettlements();
  logger.debug('%d ambassadors to be processed', ambassadors.length);

  await Promise.all(ambassadors.map(async(ambassador) => {
    await Promise.all(ambassador.get('gets_paid').map(async(relationship) => {
      let payout = relationship.otherNode();
      if (payout.get('status') === 'disbursed') {
        let tripler = await triplerSvc.findById(relationship.get('tripler_id'));
        fifo.add(disburse_task(ambassador, tripler));
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