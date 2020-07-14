import { Router } from 'express';
import { normalize } from '../../../../lib/phone';
import neo4j from 'neo4j-driver';
import format from 'string-format';

import {
  _204, _400, _401, _403, _404, _500, geoCode
} from '../../../../lib/utils';

import {
  validateEmpty, validatePhone, validateEmail
} from '../../../../lib/validations';

import { v4 as uuidv4 } from 'uuid';
import { serializeAmbassador, serializeTripler } from './serializers';
import sms from '../../../../lib/sms';
import { ov_config } from '../../../../lib/ov_config';

async function createAmbassador(req, res) {
  let new_ambassador = null;
  try {
    if (!validateEmpty(req.body, ['first_name', 'phone', 'address'])) {
      return _400(res, "Invalid payload, ambassador cannot be created");
    }

    if (!validatePhone(req.body.phone)) {
      return _400(res, "Invalid phone");
    }

    if (req.models.Ambassador.phone.unique) {
      let existing_ambassador = await req.neode.first('Ambassador', 'phone', normalize(req.body.phone));
      if(existing_ambassador) {
        return _400(res, "Ambassador with this phone already exists");
      }
    }

    if (req.body.email) {
      if (!validateEmail(req.body.email)) return _400(res, "Invalid email");  

      if (req.models.Ambassador.email.unique && 
          await req.neode.first('Ambassador', 'email', req.body.email)) {
        return _400(res, "Ambassador with this email already exists");
      }
    }

    let coordinates = await geoCode(req.body.address);
    if (coordinates === null) {
      return _400(res, "Invalid address, ambassador cannot be created");
    }

    new_ambassador = await req.neode.create('Ambassador', {
      id: uuidv4(),
      first_name: req.body.first_name,
      last_name: req.body.last_name || null,
      phone: normalize(req.body.phone),
      email: req.body.email || null,
      address: JSON.stringify(req.body.address),
      quiz_results: JSON.stringify(req.body.quiz_results) || null,
      approved: false,
      locked: false,
      signup_completed: false,
      location: {
        latitude: parseFloat(coordinates.latitude, 10),
        longitude: parseFloat(coordinates.longitude, 10)
      }
    })
  } catch(err) {
    req.logger.error("Unhandled error in %s: %s", req.url, err);
    return _500(res, 'Unable to create ambassador');
  }
  return res.json(serializeAmbassador(new_ambassador));
}

async function countAmbassadors(req, res) {
  let count = await req.neode.query()
    .match('a', 'Ambassador')
    .return('count(a) as count')
    .execute()

  return res.json({ count: count.records[0]._fields[0].low });
}

async function fetchAmbassadors(req, res) {
  let query = {};
  
  if (req.query.phone) query.phone = normalize(req.query.phone);
  if (req.query.email) query.email = req.query.email;
  if (req.query['external-id']) query.external_id = req.query['external-id'];
  if (req.query.approved) query.approved = req.query.approved.toLowerCase() === 'true';  
  if (req.query.locked) query.locked = req.query.locked.toLowerCase() === 'true';
  if (req.query['signup-completed']) query.signup_completed = req.query['signup-completed'] === 'true';

  const collection = await req.neode.model('Ambassador').all(query);
  let models = [];
  for (var index = 0; index < collection.length; index++) {
    let entry = collection.get(index);
    models.push(serializeAmbassador(entry))
  }
  return res.json(models);
}

async function fetchAmbassador(req, res) {
  let ambassador = await req.neode.first('Ambassador', 'id', req.params.ambassadorId);
  if (ambassador) {
    return res.json(serializeAmbassador(ambassador));
  }
  else {
    return _404(res, "Ambassador not found");
  }
}

async function fetchCurrentAmbassador(req, res) {
  if (!req.user.get) return _400(res, "No current ambassador");
  return res.json(serializeAmbassador(req.user));
}

async function approveAmbassador(req, res) {
  let found = null;
  found = await req.neode.first('Ambassador', 'id', req.params.ambassadorId);

  if (!found) {
    return _404(res, "Ambassador not found");
  }

  let json = {...{approved: true, locked: false}};
  let updated = await found.update(json);

  try {
    await sms(found.get('phone'), format(process.env.AMBASSADOR_APPROVED_MESSAGE, 
                                    {
                                      ambassador_first_name: found.get('first_name'),
                                      ambassador_last_name: found.get('last_name') || '',
                                      organization_name: process.env.ORGANIZATION_NAME,
                                      ambassador_landing_page: process.env.AMBASSADOR_LANDING_PAGE
                                    }));
  } catch (err) {
    req.logger.error("Unhandled error in %s: %s", req.url, err);
    return _500(res, 'Error sending approved sms to the ambassador');
  }

  return _204(res);
}

async function disapproveAmbassador(req, res) {
  let found = null;
  found = await req.neode.first('Ambassador', 'id', req.params.ambassadorId);

  if (!found) {
    return _404(res, "Ambassador not found");
  }

  let json = {...{approved: false, locked: true}};
  let updated = await found.update(json);
  return _204(res);
}

async function makeAdmin(req, res) {
  let found = null;
  found = await req.neode.first('Ambassador', 'id', req.params.ambassadorId);

  if (!found) {
    return _404(res, "Ambassador not found");
  }

  let json = {...{admin: true}};
  await found.update(json);
  return _204(res);
}

async function signup(req, res) {
  let new_ambassador = null;
  try {
    if (!validateEmpty(req.body, ['first_name', 'phone', 'address'])) {
      return _400(res, "Invalid payload, ambassador cannot be created");
    }

    if (!validatePhone(req.body.phone)) {
      return _400(res, "Invalid phone");
    }

    if (req.models.Ambassador.phone.unique) {
      let existing_ambassador = await req.neode.first('Ambassador', 'phone', normalize(req.body.phone));
      if(existing_ambassador) {
        return _400(res, "Ambassador with this phone already exists");
      }
    }

    if (req.models.Ambassador.external_id.unique) {
      let existing_ambassador = await req.neode.first('Ambassador', 'external_id', req.externalId);
      if(existing_ambassador) {
        return _400(res, "Ambassador with this external id already exists");
      }
    }

    if (req.body.email) {
      if (!validateEmail(req.body.email)) return _400(res, "Invalid email");  

      if (req.models.Ambassador.email.unique && 
        await req.neode.first('Ambassador', 'email', req.body.email)) {
        return _400(res, "Ambassador with this email already exists");
      }
    }

    let coordinates = await geoCode(req.body.address);
    if (coordinates === null) {
      return _400(res, "Invalid address, ambassador cannot sign up with this address");
    }

    new_ambassador = await req.neode.create('Ambassador', {
      id: uuidv4(),
      first_name: req.body.first_name,
      last_name: req.body.last_name || null,
      phone: normalize(req.body.phone),
      email: req.body.email || null,
      address: JSON.stringify(req.body.address),
      quiz_results: JSON.stringify(req.body.quiz_results) || null,
      approved: false,
      locked: false,
      signup_completed: true,
      location: {
        latitude: parseFloat(coordinates.latitude, 10),
        longitude: parseFloat(coordinates.longitude, 10)
      },
      external_id: req.externalId
    });
  } catch(err) {
    req.logger.error("Unhandled error in %s: %s", req.url, err);
    return _500(res, 'Unable to update ambassador form data');
  }
  return res.json(serializeAmbassador(new_ambassador));
}

async function updateAmbassador(req, res) {
  let found = await req.neode.first('Ambassador', 'id', req.params.ambassadorId);
  if (!found) {
    return _404(res, "Ambassador not found");
  }

  if (req.body.phone) {
    if (!validatePhone(req.body.phone)) {
      return _400(res, "Invalid phone");
    }

    if (req.models.Ambassador.phone.unique) {
      let existing_ambassador = await req.neode.first('Ambassador', 'phone', normalize(req.body.phone));
      if(existing_ambassador && existing_ambassador.get('id') !== found.get('id')) {
        return _400(res, "Ambassador with this phone already exists");
      }
    }
  }

  if (req.body.email) {
    if (!validateEmail(req.body.email)) return _400(res, "Invalid email");  

    if (req.models.Ambassador.email.unique) {
      let existing_ambassador = await req.neode.first('Ambassador', 'email', req.body.email);
      if(existing_ambassador && existing_ambassador.get('id') !== found.get('id')) {
        return _400(res, "Ambassador with this email already exists");
      }
    }
  }

  let whitelistedAttrs = ['first_name', 'last_name', 'date_of_birth', 'email'];

  let json = {};
  for (let prop in req.body) {
    if (whitelistedAttrs.indexOf(prop) !== -1) {
      json[prop] = req.body[prop];
    }
  }

  if (req.body.phone) {
    json.phone = normalize(req.body.phone);
  }

  if (req.body.address) {
    let coordinates = await geoCode(req.body.address);
    if (coordinates === null) {
      return _400(res, "Invalid address, ambassador cannot be updated");
    }
    json.address = JSON.stringify(req.body.address);
    json.location = new neo4j.types.Point(4326, // WGS 84 2D
                                           parseFloat(coordinates.longitude, 10),
                                           parseFloat(coordinates.latitude, 10));
  }

  if (req.body.quiz_results) {
    json.quiz_results = JSON.stringify(res.body.quiz_results);
  }
  let updated = await found.update(json);
  return res.json(serializeAmbassador(updated));
}

async function updateCurrentAmbassador(req, res) {
  let found = req.user;

  if (req.body.phone) {
    if (!validatePhone(req.body.phone)) {
      return _400(res, "Invalid phone");
    }

    if (req.models.Ambassador.phone.unique) {
      let existing_ambassador = await req.neode.first('Ambassador', 'phone', normalize(req.body.phone));
      if(existing_ambassador && existing_ambassador.get('id') !== found.get('id')) {
        return _400(res, "Ambassador with this phone already exists");
      }
    }
  }

  if (req.body.email) {
    if (!validateEmail(req.body.email)) return _400(res, "Invalid email");  

    if (req.models.Ambassador.email.unique) {
      let existing_ambassador = await req.neode.first('Ambassador', 'email', req.body.email);
      if(existing_ambassador && existing_ambassador.get('id') !== found.get('id')) {
        return _400(res, "Ambassador with this email already exists");
      }
    }
  }

  let whitelistedAttrs = ['first_name', 'last_name', 'date_of_birth', 'email'];

  let json = {};
  for (let prop in req.body) {
    if (whitelistedAttrs.indexOf(prop) !== -1) {
      json[prop] = req.body[prop];
    }
  }

  if (req.body.phone) {
    json.phone = normalize(req.body.phone);
  }

  if (req.body.address) {
    let coordinates = await geoCode(req.body.address);
    if (coordinates === null) {
      return _400(res, "Invalid address, ambassador cannot be updated");
    }
    json.address = JSON.stringify(req.body.address);
    json.location = new neo4j.types.Point(4326, // WGS 84 2D
                                           parseFloat(coordinates.longitude, 10),
                                           parseFloat(coordinates.latitude, 10));
  }

  if (req.body.quiz_results) {
    json.quiz_results = JSON.stringify(req.body.quiz_results);
  }
  let updated = await found.update(json);
  return res.json(serializeAmbassador(updated));
}

async function deleteAmbassador(req, res) {
  let found = await req.neode.first('Ambassador', 'id', req.params.ambassadorId);
  if (!found) {
    return _404(res, "Ambassador not found");
  }

  if (req.user.get('id') === req.params.ambassadorId) {
    return _400(res, "Cannot delete self");
  }

  found.delete();

  return _204(res);
}

async function claimTriplers(req, res) {
  let ambassador = req.user;

  if (!req.body.triplers || req.body.triplers.length === 0) {
    return _400(res, 'Invalid request, empty list of triplers');
  }

  let triplers = [];
  for (let entry of req.body.triplers) {
    let model = await req.neode.first('Tripler', 'id', entry);
    if (!model) {
      return _404(res, 'Tripler not found, invalid id');
    }
    triplers.push(model);
  }

  ambassador.get('claims').forEach((entry) => triplers.push(entry.otherNode.get('id')));
  triplers = [... new Set(triplers)]; // eliminate duplicates
  if (triplers.length > parseInt(ov_config.claim_tripler_limit)) {
    return _400(res, `An ambassador cannot have more than ${ov_config.claim_tripler_limit} triplers`);
  }

  for(let entry of triplers) {
    await ambassador.relateTo(entry, 'claims');
  }

  return _204(res);
}

function claimedTriplers(req, res) {
  let ambassador = req.user;

  let triplers = [];
  ambassador.get('claims').forEach((entry) => triplers.push(serializeTripler(entry.otherNode())));
  return res.json(triplers);
}

function checkAmbassador(req, res) {
  return res.json( { exists: !!req.user.get } );
}

module.exports = Router({mergeParams: true})
.post('/ambassadors/signup', (req, res) => {
  return signup(req, res);
})
.get('/ambassadors/current', (req, res) => {
  if (Object.keys(req.user).length === 0 && req.user.constructor === Object) {
    return fetchCurrentAmbassador(req, res);
  }
  if (!req.authenticated) return _401(res, 'Permission denied.')
  return fetchCurrentAmbassador(req, res);
})
.put('/ambassadors/current', (req, res) => {
  if (!req.authenticated) return _401(res, 'Permission denied.')
  return updateCurrentAmbassador(req, res);
})
.put('/ambassadors/current/triplers', (req, res) => {
  if (!req.authenticated) return _401(res, 'Permission denied.')
  return claimTriplers(req, res);
})
.get('/ambassadors/current/triplers', (req, res) => {
  if (!req.authenticated) return _401(res, 'Permission denied.')
  return claimedTriplers(req, res);
})
.get('/ambassadors/exists', (req, res) => {
  return checkAmbassador(req, res);
})

.post('/ambassadors', (req, res) => {
  if (!req.authenticated) return _401(res, 'Permission denied.')
  if (!req.admin) return _403(res, "Permission denied.");
  return createAmbassador(req, res);
})
.get('/ambassadors', (req, res) => {
  if (!req.authenticated) return _401(res, 'Permission denied.')
  if (!req.admin) return _403(res, "Permission denied.");
  return fetchAmbassadors(req, res);
})
.get('/ambassadors/count', (req, res) => {
  if (!req.authenticated) return _401(res, 'Permission denied.')
  if (!req.admin) return _403(res, "Permission denied.");
  return countAmbassadors(req, res);
})
.get('/ambassadors/:ambassadorId', (req, res) => {
  if (!req.authenticated) return _401(res, 'Permission denied.')
  if (!req.admin) return _403(res, "Permission denied.");
  return fetchAmbassador(req, res);
})
.put('/ambassadors/:ambassadorId/approve', (req, res) => {
  if (!req.authenticated) return _401(res, 'Permission denied.')
  if (!req.admin) return _403(res, "Permission denied.");
  return approveAmbassador(req, res);
})
.put('/ambassadors/:ambassadorId/disapprove', (req, res) => {
  if (!req.authenticated) return _401(res, 'Permission denied.')
  if (!req.admin) return _403(res, "Permission denied.");
  return disapproveAmbassador(req, res);
})
.put('/ambassadors/:ambassadorId/admin', (req, res) => {
  if (!req.authenticated) return _401(res, 'Permission denied.')
  if (!req.isLocal) return _403(res, "Permission denied.");
  if (ov_config.make_admin_api !== 'true') return _403(res, 'Permission denied.');
  return makeAdmin(req, res);
})
.put('/ambassadors/:ambassadorId', (req, res) => {
  if (!req.authenticated) return _401(res, 'Permission denied.')
  if (!req.admin) return _403(res, "Permission denied.");
  return updateAmbassador(req, res);
})
.delete('/ambassadors/:ambassadorId', (req, res) => {
  if (!req.authenticated) return _401(res, 'Permission denied.')
  if (!req.admin) return _403(res, "Permission denied.");
  return deleteAmbassador(req, res);
})
