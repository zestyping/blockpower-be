import stringFormat from 'string-format';

import neo4j from 'neo4j-driver';
import neode from '../lib/neode';
import { serializeName } from '../lib/utils';
import { normalize } from '../lib/phone';
import mail from '../lib/mail';
import { ov_config } from '../lib/ov_config';
import sms from '../lib/sms';
import stripe from './stripe';

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
    if (!tripler.get('upgrade_sms_sent') || tripler.get('upgrade_sms_sent') === false) {
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
  }
  else {
    throw "Invalid status, cannot confirm";
  }

  // send email in the background
  let tripler_name = serializeName(tripler.get('first_name'), tripler.get('last_name'));
  let tripler_phone = tripler.get('phone');
  let triplees = JSON.parse(tripler.get('triplees'));
  let ambassador_name = serializeName(ambassador.get('first_name'), ambassador.get('last_name'));

  setTimeout(async ()=> {
    let subject = stringFormat(ov_config.tripler_confirm_admin_email_subject,
                            {
                              organization_name: ov_config.organization_name
                            });
    let body = stringFormat(ov_config.tripler_confirm_admin_email_body,
                            {
                              tripler_name: tripler_name,
                              tripler_phone: tripler_phone,
                              triplee_1: triplees[0],
                              triplee_2: triplees[1],
                              triplee_3: triplees[2],
                              ambassador_name: ambassador_name,
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
                                      triplee_1: triplees[0],
                                      triplee_2: triplees[1],
                                      triplee_3: triplees[2]
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
        triplee_1: triplees[0],
        triplee_2: triplees[1],
        triplee_3: triplees[2]
      }
    ));
  } else {
    throw "Invalid tripler";
  }
}

module.exports = {
  findById: findById,
  findByPhone: findByPhone,
  confirmTripler: confirmTripler,
  detachTripler: detachTripler,
  reconfirmTripler: reconfirmTripler,
  findRecentlyConfirmedTriplers: findRecentlyConfirmedTriplers
};
