import stripe from 'stripe';
import { ov_config } from '../lib/ov_config';

async function createConnectAccount(user, bankAccountToken, acceptanceIp) {
  let address = JSON.parse(user.get('address'));
  return await stripe(ov_config.stripe_secret_key).accounts.create({
    type: 'custom',
    country: 'US',
    email: user.get('email') ? user.get('email') : undefined,
    requested_capabilities: [
      'transfers',
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

async function disburse(ambassador, tripler) {
  // pending => disbursed => settled

  if (!ambassador.get('approved')) {
    throw 'Ambassador not approved, cannot pay';
  }

  if (ambassador.get('locked')) {
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

  let query = `MATCH (a:Ambassador{id: \'${ambassador.get('id')}\'})-[r:EARNS_OFF]->(t:Tripler{id: \'${tripler.get('id')}\'}) RETURN r`;
  let res = await neode.cypher(query);
  if (res.records.length > 0) {
    let properties = res.records[0]._fields[0].properties;
    if (properties.status !== 'pending') {
      return;
    }
  } 

  let amount = ov_config.payout_per_tripler;
  if (!amount) {
    throw 'Configuration error, cannot pay';
  }
  amount = parseInt(amount);

  let stripe_account = null;
  ambassador.get('owns_account').forEach((entry) => {
    if (entry.otherNode().get('account_type') == 'stripe') {
      stripe_account = entry.otherNode();
    }
  });

  let stripe_account_id = stripe_account.get('account_id');
  if (!stripe_account_id) {
    throw 'Stripe account not set for ambassador, cannot pay';
  }

  // create relationship and send money

  await ambassador.relateTo(tripler, 'earns_off', { status: 'pending' });
  let payout = null;

  try {
    payout = await stripe(process.env.stripe_secret_key).transfers.create({
      amount: amount,
      currency: 'usd',
      destination: stripe_account_id,
      transfer_group: `A: ${ambassador.get('phone')} T: ${tripler.get('phone')}`
    });
  } catch(err) {
    await ambassador.relateTo(tripler, 'earns_off', { error: JSON.stringify(err) });
    throw err;  
  }

  // update relationship details
  await ambassador.relateTo(tripler, 'earns_off', { status: 'disbursed', disbursed_at: new Date(), amount: amount, payout_id: payout.id });
}

async function settle() {

}

module.exports = {
  createConnectAccount: createConnectAccount,
  disburse: disburse,
  settle: settle
};