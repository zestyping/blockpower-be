import { v4 as uuidv4 } from 'uuid';
import stringFormat from 'string-format';

import neode  from '../lib/neode';

import {
  validateEmpty, validatePhone, validateEmail
} from '../lib/validations';

import { ValidationError }  from '../lib/errors';
import { geoCode } from '../lib/utils';
import { normalize } from '../lib/phone';
import mail from '../lib/mail';
import { ov_config } from '../lib/ov_config';

import models from '../models/va';

function serializeName(first_name, last_name) {
  if (!last_name) return first_name;
  return [first_name, last_name].join(" ");
}

async function findByExternalId(externalId) {
  return await neode.first('Ambassador', 'external_id', externalId);
}

async function findById(id) {
  return await neode.first('Ambassador', 'id', id);
}

async function findAmbassadorsWithPendingDisbursements() {
  let query = `MATCH (a:Ambassador)-[:GETS_PAID]->(:Payout {status: \'pending\'}) RETURN a.id`;
  let res = await neode.cypher(query);
  let ambassadors = [];
  if (res.records.length > 0) {
    ambassadors = await Promise.all(res.records.map(async(entry) => {
      return await findById(entry._fields[0]);
    }));
  }
  return ambassadors;
}

async function findAmbassadorsWithPendingSettlements() {
  let query = `MATCH (a:Ambassador)-[:GETS_PAID]->(:Payout {status: \'disbursed\'}) RETURN a.id`;
  let res = await neode.cypher(query);
  let ambassadors = [];
  if (res.records.length > 0) {
    ambassadors = await Promise.all(res.records.map(async(entry) => {
      return await findById(entry._fields[0]);
    }));
  }
  return ambassadors;
}

async function signup(json) {
  if (!validateEmpty(json, ['first_name', 'phone', 'address'])) {
    throw new ValidationError("Invalid payload, ambassador cannot be created");
  }

  if (!validatePhone(json.phone)) {
    throw new ValidationError("Invalid phone");
  }

  if (models.Ambassador.phone.unique) {
    let existing_ambassador = await neode.first('Ambassador', 'phone', normalize(json.phone));
    if(existing_ambassador) {
      throw new ValidationError("Ambassador with this phone already exists");
    }
  }

  if (models.Ambassador.external_id.unique) {
    let existing_ambassador = await neode.first('Ambassador', 'external_id', json.externalId);
    if(existing_ambassador) {
      throw new ValidationError("Ambassador with this external id already exists");
    }
  }

  if (json.email) {
    if (!validateEmail(json.email)) throw "Invalid email";  

    if (models.Ambassador.email.unique && 
      await neode.first('Ambassador', 'email', json.email)) {
      throw new ValidationError("Ambassador with this email already exists");
    }
  }

  let coordinates = await geoCode(json.address);
  if (coordinates === null) {
    throw new ValidationError("Invalid address, ambassador cannot sign up with this address");
  }

  let new_ambassador = await neode.create('Ambassador', {
    id: uuidv4(),
    first_name: json.first_name,
    last_name: json.last_name || null,
    phone: normalize(json.phone),
    email: json.email || null,
    address: JSON.stringify(json.address),
    quiz_results: JSON.stringify(json.quiz_results) || null,
    approved: false,
    locked: false,
    signup_completed: true,
    onboarding_completed: false,
    location: {
      latitude: parseFloat(coordinates.latitude, 10),
      longitude: parseFloat(coordinates.longitude, 10)
    },
    external_id: json.externalId
  });

  // send email in the background
  let ambassador_name = serializeName(new_ambassador.get('first_name'), new_ambassador.get('last_name'))
  setTimeout(async ()=> {
    let body = stringFormat(ov_config.new_ambassador_signup_admin_email_body,
                            {
                              ambassador_name: ambassador_name,
                              organization_name: ov_config.organization_name
                            });
    await mail(ov_config.admin_emails, null, null, 
               ov_config.new_ambassador_signup_admin_email_subject,
               body);
  }, 100);

  return new_ambassador;
}

module.exports = {
  findByExternalId: findByExternalId,
  findById: findById,
  findAmbassadorsWithPendingDisbursements: findAmbassadorsWithPendingDisbursements,
  findAmbassadorsWithPendingSettlements: findAmbassadorsWithPendingSettlements,
  signup: signup
};
