import stringFormat from 'string-format';

import neode  from '../lib/neode';
import { normalize } from '../lib/phone';
import { ov_config } from '../lib/ov_config';
import sms from '../lib/sms';
import stripe from 'stripe';

async function findById(triplerId) {
  return await neode.first('Tripler', 'id', triplerId);
}

async function findByPhone(phone) {
  return await neode.first('Tripler', 'phone', normalize(phone));
}

async function confirmTripler(triplerId) {
  let tripler = await neode.first('Tripler', 'id', triplerId);
  if (tripler && tripler.get('status') === 'pending') {
    await tripler.update({ status: 'confirmed' });    

    // Send a payment to this tripler's ambassador
    let ambassador = tripler.get('claimed');

    let stripeResponse
    let intentResponse

    try {

      stripeResponse = await stripe(ov_config.stripe_secret_key).transfers.create({
        amount: 5000,
        currency: 'usd',
        description: 'voter ambassador payout',
        destination: ambassador.get('payout_account_id')
      })
    } catch (err) {
      console.log('stripe errored: ', err)
    }
  }
  else {
    throw "Invalid status, cannot confirm";
  }
}

async function detachTripler(triplerId) {
  let tripler = await neode.first('Tripler', 'id', triplerId);
  if (tripler) {
    let ambassador = tripler.get('claimed');
    if (ambassador) {
      let query = `MATCH (t:Tripler{id: \'${tripler.get('id')}\'}) DETACH DELETE t`;
      console.log(query);
      await neode.cypher(query);
    }
  }
  else {
    throw "Invalid tripler, cannot detach";
  }
}

async function reconfirmTripler(triplerId) {
  let tripler = await neode.first('Tripler', 'id', triplerId);
  if (tripler) {
    if (tripler.get('status') !== 'pending') {
      throw "Invalid status, cannot proceed";
    }

    let ambassador = tripler.get('claimed');

    let triplees = JSON.parse(tripler.get('triplees'));
    await sms(tripler.get('phone'), stringFormat(ov_config.tripler_reconfirmation_message,
                                    {
                                      ambassador_first_name: ambassador.get('first_name'),
                                      ambassador_last_name: ambassador.get('last_name') || '',
                                      organization_name: process.env.ORGANIZATION_NAME,
                                      tripler_first_name: tripler.get('first_name'),
                                      triplee_1: triplees[0],
                                      triplee_2: triplees[1],
                                      triplee_3: triplees[2]
                                    }));
  }
  else {
    throw "Invalid tripler";
  }
}

module.exports = {
  findById: findById,
  findByPhone: findByPhone,
  confirmTripler: confirmTripler,
  detachTripler: detachTripler,
  reconfirmTripler: reconfirmTripler
};
