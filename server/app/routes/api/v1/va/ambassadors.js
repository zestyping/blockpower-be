import { Router } from 'express';

import {
  _204, _404, _400, _500, geoCode, validateEmpty
} from '../../../../lib/utils';

import sampleAmbassador from './fixtures/ambassador.json';
import ambassadorsList from './fixtures/ambassadors.json';

import { v4 as uuidv4 } from 'uuid';

function _serializeAmbassador(ambassador) {
  let obj = {};
  ['id', 'first_name', 'last_name', 'phone', 'email', 'latitude', 'longitude'].forEach(x => obj[x] = ambassador.get(x));
  obj['address'] = ambassador.get('address') !== null ? JSON.parse(ambassador.get('address')) : null;
  obj['quiz_results'] = ambassador.get('quiz_results') !== null ? JSON.parse(ambassador.get('quiz_results')) : null;

  return obj
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

async function updateAmbassador(req, res) {
  let found = null;
  found = await req.neode.first('Ambassador', 'id', req.params.ambassadorId);

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
  ambassador = await req.neode.first('Ambassador', 'id', req.params.ambassadorId);

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

// TODO admin api
.get('/ambassadors', (req, res) => {
  return fetchAmbassadors(req, res);
})

// TODO admin api
.get('/ambassadors/count', (req, res) => {
  return countAmbassadors(req, res);
})

// TODO admin api
.get('/ambassadors/:ambassadorId', (req, res) => {
  return fetchAmbassador(req, res);
})

// TODO rename to /current
.put('/ambassadors/:ambassadorId', (req, res) => {
  return updateAmbassador(req, res);
})

// TODO rename to /current
.put('/ambassadors/:ambassadorId/triplers', (req, res) => {
  return claimTriplers(req, res);
})
