import { Router } from 'express';

import {
  _204, _404, _400, _500, geoCode, validateEmpty
} from '../../../../lib/utils';

import sampleAmbassador from './fixtures/ambassador.json';
import ambassadorsList from './fixtures/ambassadors.json';

import { v4 as uuidv4 } from 'uuid';

function _serializeAmbassador(ambassador) {
  let obj = {};
  ['id', 'first_name', 'last_name', 'phone', 'email', 'latitude', 'longitude', 'approved'].forEach(x => obj[x] = ambassador.get(x));
  obj['address'] = ambassador.get('address') !== null ? JSON.parse(ambassador.get('address')) : null;
  obj['quiz_results'] = ambassador.get('quiz_results') !== null ? JSON.parse(ambassador.get('quiz_results')) : null;

  return obj
}

async function isAmbassador(req_user) {
  let user = await req.neode.first('Ambassador', 'email', req_user.email);
  return user ? true : false;
}

async function createAmbassador(req, res) {
  let new_ambassador = null;
  try {
    let existing_ambassador = await req.neode.first('Ambassador', 'phone', req.body.phone);
    if(existing_ambassador) {
      return _400(res, "Ambassador with this data already exists");
    }

    if (!validateEmpty(req.body, ['first_name', 'phone', 'address'])) {
      return _400(res, "Invalid payload, ambassador cannot be created");
    }

    let coordinates = await geoCode(req.body.address);
    if (coordinates === null) {
      return _400(res, "Invalid address, ambassador cannot be created");
    }

    new_ambassador = await req.neode.create('Ambassador', {
      id: uuidv4(),
      first_name: req.body.first_name,
      last_name: req.body.last_name || null,
      phone: req.body.phone,
      email: req.body.email || null,
      address: JSON.stringify(req.body.address),
      quiz_results: JSON.stringify(req.body.quiz_results) || null,
      approved: false,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    })
  } catch(err) {
    req.logger.error("Unhandled error in %s: %j", req.url, err);
    return _500(res, 'Unable to create ambassador');
  }
  return res.json(_serializeAmbassador(new_ambassador));
}

async function countAmbassadors(req, res) {
  const collection = await req.neode.model('Ambassador').all();
  return res.json({ count: collection.length });
}

async function fetchAmbassadors(req, res) {
  const collection = await req.neode.model('Ambassador').all();
  let models = [];
  for (var index = 0; index < collection.length; index++) {
    let entry = collection.get(index);
    models.push(_serializeAmbassador(entry))
  }
  return res.json(models);
}

async function fetchAmbassador(req, res) {
  let ambassador = await req.neode.first('Ambassador', 'id', req.params.ambassadorId);
  if (ambassador) {
    return res.json(_serializeAmbassador(ambassador));
  }
  else {
    return _404(res, "Ambassador not found");
  }
}

async function approveAmbassador(req, res) {
  let found = null;
  found = await req.neode.first('Ambassador', 'id', req.params.ambassadorId);

  if (!found) {
    return _404(res, "Ambassador not found");
  }

  let json = {...{approved: true}};
  let updated = await found.update(json);
  return res.json(_serializeAmbassador(updated));
}

async function submitForm(req, res) {
  let new_ambassador = null;
  try {
    let existing_ambassador = await req.neode.first('Ambassador', 'phone', req.body.phone);
    if(existing_ambassador) {
      return _400(res, "Ambassador with this data already exists");
    }

    if (!validateEmpty(req.body, ['first_name', 'phone', 'address'])) {
      return _400(res, "Invalid payload, ambassador cannot be created");
    }

    let coordinates = await geoCode(req.body.address);
    if (coordinates === null) {
      return _400(res, "Invalid address, ambassador cannot be updated with this form data");
    }

    new_ambassador = await req.neode.merge('Ambassador', {
      id: uuidv4(),
      first_name: req.body.first_name,
      last_name: req.body.last_name || null,
      phone: req.body.phone,
      email: req.user.email,
      address: JSON.stringify(req.body.address),
      quiz_results: JSON.stringify(req.body.quiz_results) || null,
      approved: false,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    })
  } catch(err) {
    req.logger.error("Unhandled error in %s: %j", req.url, err);
    return _500(res, 'Unable to update ambassador form data');
  }
  return res.json(_serializeAmbassador(new_ambassador));
}

async function updateAmbassador(req, res) {
  let found = null;
  found = await req.neode.first('Ambassador', 'id', req.params.current);

  if (!found) {
    return _404(res, "Ambassador not found");
  }
    
  let coordinates = {
    latitude: found.latitude,
    longitude: found.longitude
  };
  let json = req.body;
  if (req.body.address) {
    coordinates = await geoCode(req.body.address);
    if (coordinates === null) {
      return _400(res, "Invalid address, ambassador cannot be updated");
    }

    json = {...req.body, ...coordinates, ...{ address: JSON.stringify(req.body.address)}};
  }

  let updated = await found.update(json);
  return res.json(_serializeAmbassador(updated));
}

async function claimTriplers(req, res) {
  let ambassador = null;
  ambassador = await req.neode.first('Ambassador', 'id', req.params.current);

  if (!ambassador) {
    return _404(res, "Ambassador not found");
  }

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

module.exports = Router({mergeParams: true})
.post('/ambassadors', (req, res) => {
  return createAmbassador(req, res);
})

.get('/ambassadors', (req, res) => {
  if (!isAmbassador(req.user)) return _403(res, "Permission denied.");
  return fetchAmbassadors(req, res);
})

.get('/ambassadors/count', (req, res) => {
  if (!isAmbassador(req.user)) return _403(res, "Permission denied.");
  return countAmbassadors(req, res);
})

.get('/ambassadors/:ambassadorId', (req, res) => {
  if (!isAmbassador(req.user)) return _403(res, "Permission denied.");
  return fetchAmbassador(req, res);
})

.put('/ambassadors/:ambassadorId/approve', (req, res) => {
  if (!isAmbassador(req.user)) return _403(res, "Permission denied.");
  return approveAmbassador(req, res);
})

.put('/ambassadors/submit', (req, res) => {
  return submitForm(req, res);
})

.put('/ambassadors/:current', (req, res) => {
  return updateAmbassador(req, res);
})

.put('/ambassadors/:current/triplers', (req, res) => {
  return claimTriplers(req, res);
})
