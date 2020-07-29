import neode from '../lib/neode';
const paypal = require('@paypal/payouts-sdk');
import { ov_config } from '../lib/ov_config';

let environment = null;
if (ov_config.paypal_environment === 'sandbox') {
   environment = new paypal.core.SandboxEnvironment(ov_config.paypal_client_id, ov_config.paypal_client_secret);
}

let client = new paypal.core.PayPalHttpClient(environment);

function validateForPayment(ambassador, tripler) {
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
}

async function disburse(ambassador, tripler) {
  // pending => disbursed => settled

  validateForPayment(ambassador, tripler);

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

  let transfer = null;

  try {
    let requestBody = {
      "sender_batch_header": {
        "recipient_type": "EMAIL",
        "email_message": "Ambassador payout",
        "note": "Ambassador payout",
        "sender_batch_id": new Date(),
        "email_subject": "This is a test transaction from SDK"
      },
      "items": [{
        "note": "Your Ambassador Payout!",
        "amount": {
          "currency": "USD",
          "value": amount / 100
        },
        "receiver": ambassador.get('email'),
        "sender_item_id": new Date()
      }]
    }

    let request = new paypal.payouts.PayoutsPostRequest();
    request.requestBody(requestBody);

    transfer = await client.execute(request);
  } catch(err) {
    await ambassador.relateTo(tripler, 'earns_off', { error: JSON.stringify(err) });
    throw err;  
  }

  // update relationship details
  await ambassador.relateTo(tripler, 'earns_off', { status: 'disbursed', disbursed_at: new Date(), amount: amount, disbursement_id: transfer.result.batch_header.payout_batch_id });
}

module.exports = {
  disburse: disburse
}
