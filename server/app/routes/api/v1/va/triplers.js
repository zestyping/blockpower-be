import { Router } from 'express';

import { ov_config } from '../../../../lib/ov_config';

import {
  _404
} from '../../../../lib/utils';

import sampleTripler from './fixtures/tripler.json';
import triplersList from './fixtures/triplers.json';

function serializeTripler(tripler) {
  let obj = {};
  ['id', 'first_name', 'last_name', 'status', 'ambassador_id', 'phone', 'email', 'latitude', 'longitude'].forEach(x => obj[x] = tripler.get(x));
  obj['address'] = tripler.get('address') !== null ? JSON.parse(tripler.get('address')) : null;
  obj['triplees'] = tripler.get('triplees') !== null ? JSON.parse(tripler.get('triplees')) : null;
  return obj
}

import { v4 as uuidv4 } from 'uuid';

async function createTripler(req, res) {
  let new_ambassador = await req.neode.create('Tripler', {
    id: uuidv4(),
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    phone: req.body.phone,
    email: req.body.email,
    address: req.body.address,
    status: req.body.status,
    ambassador_id: req.body.ambassador_id,
    triplees: req.body.triplees,
    latitude: Math.random(), // TODO: geocode
    longitude: Math.random() // TODO: geocode
  });
  return res.json({ok: true});
}

function fetchTriplersByLocation(req, res) {
  // Find all triplers within a some radius
  // NOTE: later we will use: spatial.withinDistance
  let filteredList = triplersList.filter((tripler) => {
    return inBounds(tripler, req.query.latitude, req.query.longitude, req.query.radius)
  })

  if (filteredList.length === 0) {
    return _404(res, "No triplers found within that location's radius");
  } else {
    return res.json(filteredList);
  }
}

async function fetchTriplersByAmbassadorId(req, res) {
  // Find all triplers claimed by the ambassador
  let result = await req.neode.all('Tripler', {ambassador_id: req.query.ambassador_id})
  let found = result.map(serializeTripler)

  if (found.length === 0) {
    return _404(res, "No triplers found for that ambassador ID");
  } else {
    return res.json(found);
  }
}

function fetchTriplers(req, res) {
  if (req.query.ambassador_id) {
    return fetchTriplersByAmbassadorId(req, res)
  }
  if (req.query.latitude && req.query.longitude && req.query.radius) {
    return fetchTriplersByLocation(req, res)
  }
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

function updateTripler(req, res) {
  let found = null;
  for (let tripler of triplersList) {
    if (tripler.uuid === req.params.triplerId) {
      found = tripler;
    }
  }
  if (found) {
    // we will eventually update the change here
    let updated = {...found, ...req.body}
    return res.json(updated);
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
.post('/triplers', (req, res) => {
  return createTripler(req, res);
})
.get('/triplers', (req, res) => {
  return fetchTriplers(req, res);
})
.get('/triplers/:triplerId', (req, res) => {
  return fetchTripler(req, res);
})
.put('/triplers/:triplerId', (req, res) => {
  return updateTripler(req, res);
})
