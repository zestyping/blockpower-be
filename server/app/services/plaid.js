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

async function createStripeTestBankToken() {
  const plaidClient = new plaid.Client(
    ov_config.plaid_client_id,
    ov_config.plaid_secret,
    ov_config.plaid_public_key,
    plaid.environments[ov_config.plaid_environment]
  );

  let customerInfo = {
    override_username: 'user_custom',
    override_password: JSON.stringify({
      override_accounts: [{
        starting_balance: 10000,
        type: "depository",
        subtype: "checking",
        meta: {
          name: "Checking Name 1"
        }
      }]
    })
  };

  let res = await plaidClient.sandboxPublicTokenCreate("ins_100000", ["auth"], customerInfo);

  let publicToken = res.public_token;
  res = await plaidClient.exchangePublicToken(publicToken);
  let accessToken =  res.access_token;

  let bank_accounts = await plaidClient.getAuth(accessToken, {});
  let plaid_bank_account_id = bank_accounts.accounts[0].account_id;

  res = await plaidClient.createStripeToken(accessToken, plaid_bank_account_id);
  return res.stripe_bank_account_token;
}

module.exports = {
  createStripeBankToken: createStripeBankToken,
  createStripeTestBankToken: createStripeTestBankToken
};