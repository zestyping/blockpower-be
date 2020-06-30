import { Router } from 'express';

import { ov_config } from '../../../../lib/ov_config';

import {
  _400, _401, _403, _404, _500, geoCode, validateEmpty
} from '../../../../lib/utils';

import sampleTripler from './fixtures/tripler.json';
import triplersList from './fixtures/triplers.json';

function _serializeTripler(tripler) {
  let obj = {};
  ['id', 'first_name', 'last_name', 'status', 'ambassador_id', 'phone', 'email', 'latitude', 'longitude'].forEach(x => obj[x] = tripler.get(x));
  obj['address'] = tripler.get('address') !== null ? JSON.parse(tripler.get('address')) : null;
  obj['triplees'] = tripler.get('triplees') !== null ? JSON.parse(tripler.get('triplees')) : null;
  return obj
}

import { v4 as uuidv4 } from 'uuid';

async function createTripler(req, res) {
  let new_tripler = null

  try {
    let existing_tripler = await req.neode.first('Tripler', 'phone', req.body.phone);
    if (existing_tripler) {
      return _400(res, "Tripler with this data already exists");
    }

    if (!validateEmpty(req.body, ['first_name', 'phone', 'address'])) {
      return _400(res, "Invalid payload, tripler cannot be created");
    }

    let coordinates = await geoCode(req.body.address);
    if (coordinates === null) {
      return _400(res, "Invalid address, tripler cannot be created");
    }

    const obj = {
      id: uuidv4(),
      first_name: req.body.first_name,
      last_name: req.body.last_name || null,
      phone: req.body.phone,
      email: req.body.email || null,
      address: JSON.stringify(req.body.address),
      status: req.body.status || null,
      triplees: !req.body.triplees ? null : JSON.stringify(req.body.triplees),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    }

    new_tripler = await req.neode.create('Tripler', obj);
  } catch(err) {
    req.logger.error("Unhandled error in %s: %j", req.url, err);
    return _500(res, 'Unable to create tripler');
  }
  return res.json(_serializeTripler(new_tripler));
}

function fetchTriplersByLocation(req, res) {
  // Find all triplers within a some radius
  // NOTE: later we will use: spatial.withinDistance
  // TODO fire actual query

  let filteredList = triplersList.filter((tripler) => {
    return inBounds(tripler, req.user.latitude, req.user.longitude, req.query.radius || 10)
  })

  if (filteredList.length === 0) {
    return _404(res, "No triplers found within that location's radius");
  } else {
    return res.json(filteredList);
  }
}

async function fetchTriplersByAmbassadorId(req, res) {
  // Find all triplers claimed by the ambassador

  let ambassador = await req.neode.first('Ambassador', 'id', req.query.ambassador_id);
  if (!ambassador) {
    return _404(res, 'Ambassador not found');
  }

  let triplers = [];
  ambassador.get('claims').forEach((entry) => triplers.push(_serializeTripler(entry.otherNode())));
  return res.json(triplers);
}

async function fetchAllTriplers(req, res) {
  const collection = await req.neode.model('Tripler').all();
  let models = [];
  for (var index = 0; index < collection.length; index++) {
    let entry = collection.get(index);
    models.push(_serializeTripler(entry))
  }
  return res.json(models);
}

function fetchTriplers(req, res) {
  if (req.query.ambassador_id) {
    return fetchTriplersByAmbassadorId(req, res);
  }
  else {
    return fetchAllTriplers(req, res);
  }
}

function suggestTriplers(req, res) {
  return fetchTriplersByLocation(req, res);
}


async function fetchTripler(req, res) {
  let found = await req.neode.first('Tripler', 'id', req.params.triplerId)
  if (found) {
    return res.json(serializeTripler(found));
  }
  else {
    return _404(res, "Tripler not found");
  }
}

async function updateTripler(req, res) {
  let found = null;
  found = await req.neode.first('Tripler', 'id', req.params.triplerId);
  if (found) {
    let coordinates = {
      latitude: found.latitude,
      longitude: found.longitude
    };
    let json = req.body;
    if (req.body.address) {
      let coordinates = await geoCode(req.body.address);
      if (coordinates === null) {
        return _400(res, "Invalid address, tripler cannot be updated");
      }

      json = {
        ...req.body,
        ...coordinates,
        ...{ address: JSON.stringify(req.body.address)},
        ...{ triplees: JSON.stringify(req.body.triplees)}
      };
    }

    let updated = await found.update(json);
    return res.json(_serializeTripler(updated));
  }
  else {
    return _404(res, "Tripler not found");
  }
}

function inBounds(tripler, latitude, longitude, radius) {
  let x1 = parseFloat(tripler.latitude, 10);
  let y1 = parseFloat(tripler.longitude, 10);
  let x2 = parseFloat(latitude, 10);
  let y2 = parseFloat(longitude, 10);
  let distance = Math.sqrt((x1 - x2)^2 + (y1 - y2)^2);
  return distance < parseFloat(radius, 10);
}

module.exports = Router({mergeParams: true})
// TODO admin api
.post('/triplers', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.');
  //if (!req.user.admin) return _403(res, "Permission denied.");;
  return createTripler(req, res);
})

.get('/triplers', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.');
  return fetchTriplers(req, res);
})
.get('/suggest-triplers', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.');
  return suggestTriplers(req, res);
})
.get('/triplers/:triplerId', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.');
  return fetchTripler(req, res);
})
.put('/triplers/:triplerId', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.');
  // allow update only of current amabassador's triplers
  // only triplee should be updatable
  return updateTripler(req, res);
})