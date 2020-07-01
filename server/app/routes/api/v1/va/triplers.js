import { Router } from 'express';

import { ov_config } from '../../../../lib/ov_config';

import {
  _204, _400, _401, _403, _404, _500, geoCode, validateEmpty
} from '../../../../lib/utils';

import { serializeTripler } from './common';

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
      longitude: coordinates.longitude,
      status: 'unconfirmed'
    }

    new_tripler = await req.neode.create('Tripler', obj);
  } catch(err) {
    req.logger.error("Unhandled error in %s: %j", req.url, err);
    return _500(res, 'Unable to create tripler');
  }
  return res.json(serializeTripler(new_tripler));
}

function fetchTriplersByLocation(req, res) {
  // Find all triplers within a some radius
  // NOTE: later we will use: spatial.withinDistance
  // TODO fire actual query

  return res.json([]);
}

async function fetchAllTriplers(req, res) {
  const collection = await req.neode.model('Tripler').all();
  let models = [];
  for (var index = 0; index < collection.length; index++) {
    let entry = collection.get(index);
    models.push(serializeTripler(entry))
  }
  return res.json(models);
}

async function fetchTripler(req, res) {
  let ambassador = req.user;
  let tripler = null;
  ambassador.get('claims').forEach((entry) => { if (entry.otherNode().get('id') === req.params.triplerId) { tripler = entry.otherNode() } } );
  
  if (!tripler) {
    return _400(res, "Invalid triper id");
  }
  return res.json(serializeTripler(tripler));
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
    return res.json(serializeTripler(updated));
  }
  else {
    return _404(res, "Tripler not found");
  }
}

async function startTriplerConfirmation(req, res) {
  let ambassador = req.user;
  let tripler = null;
  ambassador.get('claims').forEach((entry) => { if (entry.otherNode().get('id') === req.params.triplerId) { tripler = entry.otherNode() } } );
  
  if (!tripler) {
    return _400(res, "Invalid triper id");
  }
  else if (tripler.get('status') !== 'unconfirmed') {
    return _400(res, "Invalid status, cannot proceed")
  }

  let triplees = req.body.triplees;
  if (!triplees || triplees.length !== 3) {
    return _400(res, 'Insufficient triplees, cannot start confirmation')
  }

  let phone = req.body.phone || tripler.get('phone');

  // TODO send SMS
  await tripler.update({ triplees: JSON.stringify(triplees), status: 'pending', phone: phone });
  return _204(res);
}

async function remindTripler(req, res) {
  let ambassador = req.user;
  let tripler = null;
  ambassador.get('claims').forEach((entry) => { if (entry.otherNode().get('id') === req.params.triplerId) { tripler = entry.otherNode() } } );
  
  if (!tripler) {
    return _400(res, "Invalid triper id");
  }
  else if (tripler.get('status') !== 'pending') {
    return _400(res, "Invalid status, cannot proceed")
  }

  // TODO send SMS
  return _204(res);
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
  if (!req.user.get('admin')) return _403(res, "Permission denied.");;
  return createTripler(req, res);
})
.put('/triplers/:triplerId', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.');
  if (!req.user.get('admin')) return _403(res, "Permission denied.");;
  return updateTripler(req, res);
})
.get('/triplers', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.');
  if (!req.user.get('admin')) return _403(res, "Permission denied.");;
  return fetchAllTriplers(req, res);
})

.get('/suggest-triplers', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.');
  // David working on it
  return fetchTriplersByLocation(req, res);
})
.put('/triplers/:triplerId/start-confirm', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.');
  return startTriplerConfirmation(req, res);
})
.put('/triplers/:triplerId/remind', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.');
  return remindTripler(req, res);
})
.get('/triplers/:triplerId', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.');
  return fetchTripler(req, res);
})