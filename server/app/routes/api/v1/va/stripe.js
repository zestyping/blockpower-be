import { Router } from 'express';

import plaid from 'plaid';
import stripe from 'stripe';

import {
  _400, _401, _204
} from '../../../../lib/utils';
import { ov_config } from '../../../../lib/ov_config';

module.exports = Router({mergeParams: true})
.post('/payouts/stripe/account', async (req, res) => {
  return createStripeAccount(req, res);
});

async function createStripeAccount(req, res) {
  if (!req.authenticated) return _401(res, 'Permission denied.');
  if (!req.user.get('email')) return _400(res, "Incomplete user data 'email'.");
  if (!req.body.token) return _400(res, "Invalid value to parameter 'token'.");
  if (!req.body.account_id) return _400(res, "Invalid value to parameter 'account_id'.");

  const plaidClient = new plaid.Client(
    ov_config.plaid_client_id,
    ov_config.plaid_secret,
    ov_config.plaid_public_key,
    plaid.environments[ov_config.plaid_environment]
  );

  let plaidTokenRes;
  try {
    plaidTokenRes = await plaidClient.exchangePublicToken(req.body.token);
  } catch (err) {
    return _400(res, err);
  }

  const accessToken = plaidTokenRes.access_token;
  
  // Generate a bank account token
  let stripeTokenRes;
  try {
    stripeTokenRes = await plaidClient.createStripeToken(accessToken, req.body.account_id);
  } catch (err) {
    return _400(res, err);
  }
  
  const bankAccountToken = stripeTokenRes.stripe_bank_account_token;
  let address = JSON.parse(req.user.get('address'));
  let stripeConnectAccount = null;
  try {
    stripeConnectAccount = await stripe(ov_config.stripe_secret_key).accounts.create({
      type: 'custom',
      country: 'US',
      email: req.user.get('email') ? req.user.get('email') : undefined,
      requested_capabilities: [
        'transfers',
      ],
      business_type: 'individual',
      individual: {
        first_name: req.user.get('first_name'),
        last_name: req.user.get('last_name'),
        address: {
          line1: address.address1,
          city: address.city,
          state: address.state,
          postal_code: address.zip,
          country: 'US'
        },
        email: req.user.get('email') ? req.user.get('email') : undefined,
        phone: req.user.get('phone')
      },
      business_profile: {
        url: ov_config.business_url
      },
      external_account: bankAccountToken,
      tos_acceptance: {
        date: Math.floor(new Date() / 1000),
        ip: req.publicIP
      }
    });
  } catch (err) {
    return _400(res, err);
  }
  
  await req.user.update({ 
    payout_provider: 'stripe', 
    payout_account_id: stripeConnectAccount.id
  });
  
  return _204(res);
}

