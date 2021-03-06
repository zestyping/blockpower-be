import stripe from 'stripe';
import neo4j from 'neo4j-driver';

import neode from '../lib/neode';
import {ov_config} from '../lib/ov_config';
import {isLocked} from '../lib/fraud';

const CAPABILITY_1099_MISC = 'tax_reporting_us_1099_misc';

async function createConnectAccount(user, bankAccountToken, acceptanceIp) {
  let address = JSON.parse(user.get('address'));
  return await stripe(ov_config.stripe_secret_key).accounts.create({
    type: 'custom',
    country: 'US',
    email: user.get('email') ? user.get('email') : undefined,
    requested_capabilities: [
      'transfers'
    ],
    business_type: 'individual',
    individual: {
      first_name: user.get('first_name'),
      last_name: user.get('last_name'),
      address: {
        line1: address.address1,
        city: address.city,
        state: address.state,
        postal_code: address.zip,
        country: 'US'
      },
      email: user.get('email') ? user.get('email') : undefined,
      phone: user.get('phone')
    },
    business_profile: {
      url: ov_config.business_url
    },
    external_account: bankAccountToken,
    tos_acceptance: {
      date: Math.floor(new Date() / 1000),
      ip: acceptanceIp
    }
  });
}

async function createConnectTestAccount(user, bankAccountToken, acceptanceIp) {
  let address = JSON.parse(user.get('address'));
  let accountInfo = {
    type: 'custom',
    country: 'US',
    email: user.get('email') ? user.get('email') : undefined,
    requested_capabilities: [
      'transfers'
    ],
    business_type: 'individual',
    individual: {
      first_name: user.get('first_name'),
      last_name: user.get('last_name'),
      address: {
        line1: address.address1,
        city: address.city,
        state: address.state,
        postal_code: address.zip,
        country: 'US'
      },
      email: user.get('email') ? user.get('email') : undefined,
      phone: user.get('phone')
    },
    business_profile: {
      url: ov_config.business_url
    },
    external_account: bankAccountToken,
    tos_acceptance: {
      date: Math.floor(new Date() / 1000),
      ip: acceptanceIp
    }
  }

  return await stripe(process.env.STRIPE_SECRET_KEY).accounts.create(accountInfo);
}

function validateForPayment(ambassador, tripler) {
  if (!ambassador.get('approved')) {
    throw 'Ambassador not approved, cannot pay';
  }

  if (isLocked(ambassador)) {
    throw 'Ambassador locked, cannot pay';
  }

  let obj = tripler.get('claimed');
  if (!obj || !obj || obj.get('id') !== ambassador.get('id')) {
    throw 'Tripler not claimed by the ambassador, cannot pay';
  }

  let status = tripler.get('status');
  if (status !== 'confirmed') {
    throw 'Tripler not confirmed yet, cannot pay';
  }
}

function getStripeAccount(ambassador) {
  let payout_account = null;

  ambassador.get('owns_account').forEach((entry) => {
    if (entry.otherNode().get('account_type') === 'stripe' && entry.otherNode().get('is_primary')) {
      payout_account = entry.otherNode();
    }
  });

  if (payout_account) return payout_account;
  throw 'Stripe account not set for ambassador, cannot pay';
}

async function meets1099Requirements(ambassador) {
  let stripeAccount = null;
  try {
    stripeAccount = getStripeAccount(ambassador);
  } catch (e) {
    return false;
  }
  const accountId = stripeAccount.get('account_id');
  const capability = await stripe(ov_config.stripe_secret_key).accounts.retrieveCapability(accountId, CAPABILITY_1099_MISC);

  if(capability && capability['status'] === 'active'){
    // there is sufficient KYC information for 1099 issuance
    return true;
  }

  const requirements = capability['requirements'];
  const pastDue = requirements['past_due'];
  const currentlyDue = requirements['currently_due'];
  const eventuallyDue = requirements['eventually_due'];

  if (Array.isArray(pastDue) && pastDue.length > 0) {
    return false;
  }
  if (Array.isArray(currentlyDue) && currentlyDue.length > 0) {
    return false;
  }

  if (Array.isArray(eventuallyDue) && eventuallyDue.length > 0) {
    // let's ignore these for now
    // return false;
  }

  return true;
}

async function create1099DataEntryLink(ambassador) {
  let stripeAccount;
  try {
    stripeAccount = getStripeAccount(ambassador);
  } catch (e) {
    return null;
  }
  const account = stripeAccount.get('account_id');

  const accountDetails = await stripe(ov_config.stripe_secret_key).accounts.update(
    account,
    {capabilities: {[CAPABILITY_1099_MISC]: {requested: true}}}
  );

  const returnUrl = `${ov_config.client_base_uri}/#/triplers`; // TODO: figure out means to retrieve based on env
  const accountLink = await stripe(ov_config.stripe_secret_key).accountLinks.create({
    account,
    // refresh_url: 'http://localhost:8080/api/v1/va/ambassador/current/kyc-refresh',
    // return_url: 'http://localhost:8080/api/v1/va/ambassador/current/kyc-return',
    refresh_url: returnUrl, // TODO: add support for refresh URLs
    return_url: returnUrl,
    type: 'account_onboarding'
  });
  return accountLink;
}

function getPayoutDescription(ambassador, tripler) {
  return `A: ${ambassador.get('phone')} T: ${tripler.get('phone')}`;
}

async function disburse(ambassador, tripler) {
  // pending => disbursed => settled
  validateForPayment(ambassador, tripler);

  let query = `MATCH (:Ambassador{id: \'${ambassador.get('id')}\'})-[:GETS_PAID{tripler_id: \'${tripler.get('id')}\'}]->(p:Payout{status: \'pending\'}) RETURN p.id`;
  let res = await neode.cypher(query);
  if (res.records.length === 0) {
    return;
  }

  let payout_id = res.records[0]._fields[0];
  let payout = await neode.first('Payout', 'id', payout_id);

  let amount = parseInt(payout.get('amount'));

  let payout_account = getStripeAccount(ambassador);
  if (!payout_account) {
    throw 'Stripe account not set for ambassador, cannot pay';
  }

  // create relationships and send money

  let transfer = null;

  try {
    console.log('disbursing to ambassador %s due to tripler %s', ambassador.get('id'), tripler.get('id'));
    transfer = await stripe(ov_config.stripe_secret_key).transfers.create({
      amount: amount,
      currency: 'usd',
      destination: payout_account.get('account_id'),
      transfer_group: getPayoutDescription(ambassador, tripler)
    });
  } catch (err) {
    await payout.update({error: JSON.stringify(err)});
    throw err;
  }

  // update relationship details
  let disbursed_at = neo4j.default.types.LocalDateTime.fromStandardDate(new Date());
  await payout.update({
    status: 'disbursed',
    disbursed_at: disbursed_at,
    amount: amount,
    disbursement_id: transfer.id,
    error: null
  });
  await payout.relateTo(payout_account, 'to_account');
}

async function settle(ambassador, tripler) {
  validateForPayment(ambassador, tripler);

  let query = `MATCH (:Ambassador{id: \'${ambassador.get('id')}\'})-[r:GETS_PAID{tripler_id: \'${tripler.get('id')}\'}]->(p:Payout{status: \'disbursed\'}) RETURN p.id`;
  let res = await neode.cypher(query);
  if (res.records.length === 0) {
    return;
  }

  let payout_id = res.records[0]._fields[0];
  let payout = await neode.first('Payout', 'id', payout_id);

  let amount = parseInt(payout.get('amount'));

  let stripe_payout = null;
  try {
    console.log('settling ambassador %s due to tripler %s', ambassador.get('id'), tripler.get('id'));
    let account = null;
    let relationships = ambassador.get('owns_account');
    for (var x = 0; x < relationships.length; x++) {
      let entry = relationships.get(x);
      if (entry.get('primary') || relationships.length === 1) {
        account = entry.otherNode();
      }
    }

    if (!account) {
      throw 'Stripe account for ambassador not found, cannot settle!';
    }
    stripe_payout = await stripe(ov_config.stripe_secret_key).payouts.create({
      amount: amount,
      currency: 'usd',
      description: getPayoutDescription(ambassador, tripler)
    }, {
      stripeAccount: account.get('account_id')
    });
  } catch (err) {
    await payout.update({error: JSON.stringify(err)});
    throw err;
  }

  // update relationship details
  let settled_at = neo4j.default.types.LocalDateTime.fromStandardDate(new Date());
  await payout.update({
    status: 'settled',
    settled_at: settled_at,
    amount: amount,
    settlement_id: stripe_payout.id,
    error: null
  });
}

module.exports = {
  createConnectAccount: createConnectAccount,
  createConnectTestAccount: createConnectTestAccount,
  disburse: disburse,
  settle: settle,
  create1099DataEntryLink,
  meets1099Requirements
};
