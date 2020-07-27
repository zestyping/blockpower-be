import plaid from 'plaid';
import { ov_config } from '../lib/ov_config';

async function createStripeBankToken(token, accountId) {
  const plaidClient = new plaid.Client(
    ov_config.plaid_client_id,
    ov_config.plaid_secret,
    ov_config.plaid_public_key,
    plaid.environments[ov_config.plaid_environment]
  );

  const plaidTokenRes = await plaidClient.exchangePublicToken(token);
  const accessToken = plaidTokenRes.access_token;
  
  // Generate a bank account token
  const stripeTokenRes = await plaidClient.createStripeToken(accessToken, accountId);
  return stripeTokenRes.stripe_bank_account_token;
}

module.exports = {
  createStripeBankToken: createStripeBankToken
};