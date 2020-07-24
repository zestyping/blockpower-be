import { Router } from 'express';

import {
  _400, _401
} from '../../../../lib/utils';

import { ov_config } from '../../../../lib/ov_config';

import stripe from './stripe';

function stripePayout(req) {
  return req.query.stripe && req.query.stripe.toLowerCase() === 'true' && ov_config.payout_stripe;
}

function paypalPayout(req) {
  return req.query.paypal && req.query.paypal.toLowerCase() === 'true' && ov_config.payout_paypal;
}

module.exports = Router({mergeParams: true})
.post('/payouts/account', async (req, res) => {
  if (!req.authenticated) return _401(res, 'Permission denied.')
  
  if (stripePayout(req)) {
    return stripe.createStripeAccount(req, res);
  }
  else if (paypalPayout(req)) {
    return _400(res, 'Not implemented.');
  }
  else {
    return _400(res, 'Payouts not supported.');
  }  
});