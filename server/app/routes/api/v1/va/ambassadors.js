import { Router } from 'express';
import phone from '../../../../lib/phone';
import neo4j from 'neo4j-driver';
import format from 'string-format';

import {
  _204, _400, _401, _403, _404, _500, geoCode, validateEmpty
} from '../../../../lib/utils';

import { v4 as uuidv4 } from 'uuid';
import { serializeAmbassador, serializeTripler } from './serializers';
import sms from '../../../../lib/sms';

async function createAmbassador(req, res) {
  let new_ambassador = null;
  try {
    if (!validateEmpty(req.body, ['first_name', 'phone', 'address'])) {
      return _400(res, "Invalid payload, ambassador cannot be created");
    }

    let existing_ambassador = await req.neode.first('Ambassador', 'phone', phone(req.body.phone));
    if(existing_ambassador) {
      return _400(res, "Ambassador with this data already exists");
    }

    let coordinates = await geoCode(req.body.address);
    if (coordinates === null) {
      return _400(res, "Invalid address, ambassador cannot be created");
    }

    new_ambassador = await req.neode.create('Ambassador', {
      id: uuidv4(),
      first_name: req.body.first_name,
      last_name: req.body.last_name || null,
      phone: phone(req.body.phone),
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
  const collection = await req.neode.model('Ambassador').all();
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

  let json = {...{approved: true}};
  let updated = await found.update(json);

  try {
    await sms(found.get('phone'), format(process.env.AMBASSADOR_APPROVED_MESSAGE, 
                                    {
                                      ambassador_first_name: found.get('first_name'),
                                      ambassador_last_name: found.get('last_name') || '',
                                      organization_name: process.env.ORGANIZATION_NAME
                                    }));
  } catch (err) {
    req.logger.error("Unhandled error in %s: %s", req.url, err);
    return _500(res, 'Error sending approved sms to the ambassador');
  }

  return res.json(serializeAmbassador(updated));
}

async function disapproveAmbassador(req, res) {
  let found = null;
  found = await req.neode.first('Ambassador', 'id', req.params.ambassadorId);

  if (!found) {
    return _404(res, "Ambassador not found");
  }

  let json = {...{approved: false, locked: true}};
  let updated = await found.update(json);
  return res.json(serializeAmbassador(updated));
}

async function makeAdmin(req, res) {
  let found = null;
  found = await req.neode.first('Ambassador', 'id', req.params.ambassadorId);

  if (!found) {
    return _404(res, "Ambassador not found");
  }

  let json = {...{admin: true}};
  await found.update(json);
  return res.json(_204);
}

async function signup(req, res) {
  let new_ambassador = null;
  try {
    if (!validateEmpty(req.body, ['first_name', 'phone', 'address'])) {
      return _400(res, "Invalid payload, ambassador cannot be created");
    }

    let existing_ambassador = await req.neode.first('Ambassador', 'phone', phone(req.body.phone));
    if(existing_ambassador) {
      return _400(res, "Ambassador with this data already exists");
    }

    let coordinates = await geoCode(req.body.address);
    if (coordinates === null) {
      return _400(res, "Invalid address, ambassador cannot be updated with this form data");
    }

    new_ambassador = await req.neode.create('Ambassador', {
      id: uuidv4(),
      first_name: req.body.first_name,
      last_name: req.body.last_name || null,
      phone: phone(req.body.phone),
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
      external_id: req.external_id
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
    let existing_ambassador = await req.neode.first('Ambassador', 'phone', phone(req.body.phone));
    if(existing_ambassador && existing_ambassador.get('id') !== found.get('id')) {
      return _400(res, "Ambassador with this data already exists");
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
    json.phone = phone(req.body.phone);
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
    let existing_ambassador = await req.neode.first('Ambassador', 'phone', phone(req.body.phone));
    if(existing_ambassador && existing_ambassador.get('id') !== found.get('id')) {
      return _400(res, "Ambassador with this data already exists");
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
    json.phone = phone(req.body.phone);
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

  for(let entry of triplers) {
    await ambassador.relateTo(entry, 'claims');
  }

  return _204(res);
}

async function claimedTriplers(req, res) {
  let ambassador = req.user;

  let triplers = [];
  ambassador.get('claims').forEach((entry) => triplers.push(serializeTripler(entry.otherNode())));
  return res.json(triplers);
}

module.exports = Router({mergeParams: true})
.post('/ambassadors/signup', (req, res) => {
  return signup(req, res);
})
.get('/ambassadors/current', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.')
  return fetchCurrentAmbassador(req, res);
})
.put('/ambassadors/current', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.')
  return updateCurrentAmbassador(req, res);
})
.put('/ambassadors/current/triplers', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.')
  return claimTriplers(req, res);
})
.get('/ambassadors/current/triplers', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.')
  return claimedTriplers(req, res);
})

.post('/ambassadors', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.')
  if (!req.user.get('admin')) return _403(res, "Permission denied.");
  return createAmbassador(req, res);
})
.get('/ambassadors', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.')
  if (!req.user.get('admin')) return _403(res, "Permission denied.");
  return fetchAmbassadors(req, res);
})
.get('/ambassadors/count', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.')
  if (!req.user.get('admin')) return _403(res, "Permission denied.");
  return countAmbassadors(req, res);
})
.get('/ambassadors/:ambassadorId', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.')
  if (!req.user.get('admin')) return _403(res, "Permission denied.");
  return fetchAmbassador(req, res);
})
.put('/ambassadors/:ambassadorId/approve', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.')
  if (!req.user.get('admin')) return _403(res, "Permission denied.");
  return approveAmbassador(req, res);
})
.put('/ambassadors/:ambassadorId/disapprove', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.')
  if (!req.user.get('admin')) return _403(res, "Permission denied.");
  return disapproveAmbassador(req, res);
})
.put('/ambassadors/:ambassadorId/admin', (req, res) => {
  // TODO allow only from local
  return makeAdmin(req, res);
})
.put('/ambassadors/:ambassadorId', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.')
  if (!req.user.get('admin')) return _403(res, "Permission denied.");
  return updateAmbassador(req, res);
})
