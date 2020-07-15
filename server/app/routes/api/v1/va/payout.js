import { Router } from 'express';
import plaid from 'plaid';
import stripe from 'stripe';
import {
  _400, _401
} from '../../../../lib/utils';
import { ov_config } from '../../../../lib/ov_config';

module.exports = Router({mergeParams: true})
.post('/payout/account/token/exchange', async (req, res) => {
  return exchangeToken(req, res);
});

async function exchangeToken(req, res) {
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
  let customer;
  try {
    customer = await stripe(ov_config.stripe_secret_key).customers.create({
      source: bankAccountToken,
      email: req.user.get('email'),
    });
  } catch (err) {
    return _400(res, err);
  }
  
  req.user.update({ payout_provider: 'stripe', payout_account_id: customer.id, payout_additional_data: customer.sources.data[0].last4 });
  return res.json({});
}

