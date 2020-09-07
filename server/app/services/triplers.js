import stringFormat from 'string-format';

import neo4j from 'neo4j-driver';
import neode from '../lib/neode';
import { serializeName } from '../lib/utils';
import { normalize } from '../lib/phone';
import mail from '../lib/mail';
import { ov_config } from '../lib/ov_config';
import sms from '../lib/sms';
import stripe from './stripe';
import { serializeTripler, serializeNeo4JTripler, serializeTriplee, serializeTripleeForCSV } from '../routes/api/v1/va/serializers';

async function findById(triplerId) {
  return await neode.first('Tripler', 'id', triplerId);
}

async function findByPhone(phone) {
  return await neode.first('Tripler', 'phone', normalize(phone));
}

async function findRecentlyConfirmedTriplers() {
  let confirmed_triplers = await neode.model('Tripler').all({status: 'confirmed'});
  let recently_confirmed = [];
  for (var x = 0; x < confirmed_triplers.length; x++) {
    let tripler = confirmed_triplers.get(x);
    if (tripler.get('confirmed_at') && !tripler.get('upgrade_sms_sent') || tripler.get('upgrade_sms_sent') === false) {
      recently_confirmed.push(tripler);
    }
  }
  return recently_confirmed;
}

async function confirmTripler(triplerId) {
  let tripler = await neode.first('Tripler', 'id', triplerId);
  let ambassador = tripler.get('claimed');
  if (tripler && tripler.get('status') === 'pending') {
    let confirmed_at =  neo4j.default.types.LocalDateTime.fromStandardDate(new Date());
    await tripler.update({ status: 'confirmed', confirmed_at: confirmed_at });
    let payout = await neode.create('Payout', {amount: ov_config.payout_per_tripler, status: 'pending'});
    await ambassador.relateTo(payout, 'gets_paid', {tripler_id: tripler.get('id')});

    // If this ambassador was once a tripler, then reward the ambassador that
    // initially claimed the then-tripler, only once per upgraded ambassador

    let was_once = ambassador.get('was_once');

    if (was_once && !was_once.get('rewarded_previous_claimer')) {
      await was_once.update({ rewarded_previous_claimer: true });
      let was_tripler = was_once.otherNode();
      await was_tripler.update({ is_ambassador_and_has_confirmed: true });
      was_tripler = await neode.first('Tripler', 'id', was_tripler.get('id'));
      // This must be done because 'eager' only goes so deep
      let claimer = was_tripler.get('claimed');
      let first_reward = await neode.create('Payout', {amount: ov_config.first_reward_payout, status: 'pending'});
      await claimer.relateTo(first_reward, 'gets_paid', {tripler_id: was_tripler.get('id')});
    }
  }
  else {
    throw "Invalid status, cannot confirm";
  }

  // send ambassador an sms
  let triplees = JSON.parse(tripler.get('triplees'));
  await sms(ambassador.get('phone'), stringFormat(ov_config.tripler_confirmed_ambassador_notification,
                                  {
                                    ambassador_first_name: ambassador.get('first_name'),
                                    ambassador_landing_page: ov_config.ambassador_landing_page,
                                    payment_amount: '$' + (ov_config.payout_per_tripler / 100),
                                    tripler_first_name: tripler.get('first_name'),
                                    triplee_1: serializeTriplee(triplees[0]),
                                    triplee_2: serializeTriplee(triplees[1]),
                                    triplee_3: serializeTriplee(triplees[2])
                                  }));

  // send email in the background
  let tripler_name = serializeName(tripler.get('first_name'), tripler.get('last_name'));
  let tripler_phone = tripler.get('phone');
  let ambassador_name = serializeName(ambassador.get('first_name'), ambassador.get('last_name'));

  setTimeout(async ()=> {
    let relationships = ambassador.get('claims');
    let date_claimed = null;
    let relationship = null;
    let confirmed_at =  neo4j.default.types.LocalDateTime.fromStandardDate(new Date());
    for (let x = 0; x < relationships.length; x++) {
      let this_claim = relationships.get(x);
      let claimed_tripler = this_claim.otherNode();
      if (tripler.id === claimed_tripler.id) {
        relationship = relationships.get(x);
        date_claimed = relationship.get('since');
      }
    }
    let address = JSON.parse(tripler.get('address'));
    let body = `
    Organization Name:
    <br>
    ${ov_config.organization_name}
    <br>
    <br>
    LALVOTERID:
    <br>
    ${tripler.get('voter_id')}
    <br>
    <br>
    First Name:
    <br>
    ${tripler.get('first_name')}
    <br>
    <br>
    Last Name:
    <br>
    ${tripler.get('last_name')}
    <br>
    <br>
    Street Address:
    <br>
    ${address.address1}
    <br>
    <br>
    Zip:
    <br>
    ${address.zip}
    <br>
    <br>
    Date Claimed:
    <br>
    ${new Date(relationship.get('since'))}
    <br>
    <br>
    Date Confirmed:
    <br>
    ${new Date(confirmed_at)}
    <br>
    <br>
    Ambassador:
    <br>
    ${ambassador_name}
    <br>
    <br>
    Phone Number:
    <br>
    ${tripler.get('phone')}
    <br>
    <br>
    Triplee 1:
    <br>
    ${serializeTripleeForCSV(triplees[0])}
    <br>
    <br>
    Triplee 2:
    <br>
    ${serializeTripleeForCSV(triplees[1])}
    <br>
    <br>
    Triplee 3:
    <br>
    ${serializeTripleeForCSV(triplees[2])}
    <br>
    <br>
    `;
    let subject = stringFormat(ov_config.tripler_confirm_admin_email_subject,
                            {
                              organization_name: ov_config.organization_name
                            });
    await mail(ov_config.admin_emails, null, null,
               subject,
               body);
  }, 100);
}

async function detachTripler(triplerId) {
  let tripler = await neode.first('Tripler', 'id', triplerId);
  if (tripler) {
    let ambassador = tripler.get('claimed');
    if (ambassador) {
      await tripler.delete();
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
                                      triplee_1: serializeTriplee(triplees[0]),
                                      triplee_2: serializeTriplee(triplees[1]),
                                      triplee_3: serializeTriplee(triplees[2])
                                    }));
  }
  else {
    throw "Invalid tripler";
  }
}

async function upgradeNotification(triplerId) {
  let tripler = await neode.first('Tripler', 'id', triplerId);
  if (tripler) {
    await sms(tripler.get('phone'), stringFormat(
      ov_config.tripler_upgrade_message,
      {
        ambassador_first_name: ambassador.get('first_name'),
        ambassador_last_name: ambassador.get('last_name') || '',
        organization_name: process.env.ORGANIZATION_NAME,
        tripler_first_name: tripler.get('first_name'),
        triplee_1: serializeTriplee(triplees[0]),
        triplee_2: serializeTriplee(triplees[1]),
        triplee_3: serializeTriplee(triplees[2])
      }
    ));
  } else {
    throw "Invalid tripler";
  }
}

async function searchTriplers(query) {
  let neo4jquery = '';
  if (query.firstName) {
    neo4jquery += ` apoc.text.levenshteinDistance("${query.firstName.trim().toLowerCase()}", t.first_name) < 2.0`
  }

  if (query.lastName) {
    if (query.firstName) {
      neo4jquery += ' AND'
    }
    neo4jquery += ` apoc.text.levenshteinDistance("${query.lastName.trim().toLowerCase()}", t.last_name) < 2.0`
  }

  let collection = await neode.query()
    .match('t', 'Tripler')
    .whereRaw(neo4jquery)
    .whereRaw('NOT ()-[:CLAIMS]->(t)')
    .whereRaw('NOT ()-[:WAS_ONCE]->(t)')
    .return('t')
    .limit(ov_config.suggest_tripler_limit)
    .execute()

  let models = [];

  for (var index = 0; index < collection.records.length; index++) {
    let entry = collection.records[index]._fields[0].properties;
    models.push(serializeNeo4JTripler(entry));
  }

  return models;
}

async function startTriplerConfirmation(ambassador, tripler, triplerPhone, triplees) {
  try {
    await sms(triplerPhone, stringFormat(ov_config.tripler_confirmation_message,
                                    {
                                      ambassador_first_name: ambassador.get('first_name'),
                                      ambassador_last_name: ambassador.get('last_name') || '',
                                      organization_name: ov_config.organization_name,
                                      tripler_first_name: tripler.get('first_name'),
                                      tripler_city: JSON.parse(tripler.get('address')).city,
                                      triplee_1: serializeTriplee(triplees[0]),
                                      triplee_2: serializeTriplee(triplees[1]),
                                      triplee_3: serializeTriplee(triplees[2])
                                    }));
  } catch (err) {
    throw "Error sending confirmation sms to the tripler";
  }

  await tripler.update({ triplees: JSON.stringify(triplees), status: 'pending', phone: triplerPhone });

}


module.exports = {
  findById: findById,
  findByPhone: findByPhone,
  confirmTripler: confirmTripler,
  detachTripler: detachTripler,
  reconfirmTripler: reconfirmTripler,
  findRecentlyConfirmedTriplers: findRecentlyConfirmedTriplers,
  searchTriplers: searchTriplers,
  startTriplerConfirmation: startTriplerConfirmation,
};
