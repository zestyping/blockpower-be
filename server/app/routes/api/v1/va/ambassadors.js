import { Router } from 'express';

import {
  _404
} from '../../../../lib/utils';

import sampleAmbassador from './fixtures/ambassador.json';
import ambassadorsList from './fixtures/ambassadors.json';

import { v4 as uuidv4 } from 'uuid';

async function createAmbassador(req, res) {
  let new_ambassador = await req.neode.create('Ambassador', {
    id: uuidv4(),
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    phone: req.body.phone,
    email: req.body.email,
    address: req.body.address,
    quiz_results: req.body.quiz_results,
    latitude: Math.random(), // TODO: geocode
    longitude: Math.random() // TODO: geocode
  })
  return res.json({ok: true});
}

async function countAmbassadors(req, res) {
  const collection = await req.neode.model('Ambassador').all();
  return res.json({ count: collection.length });
}

function serializeAmbassador(ambassador) {
  let obj = {};
  ['id', 'first_name', 'last_name', 'phone', 'email', 'latitude', 'longitude'].forEach(x => obj[x] = ambassador.get(x));
  obj['address'] = ambassador.get('address') !== null ? JSON.parse(ambassador.get('address')) : null;
  obj['quiz_results'] = ambassador.get('quiz_results') !== null ? JSON.parse(ambassador.get('quiz_results')) : null;
  return obj
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
  let found = await req.neode.first('Ambassador', 'id', req.params.ambassadorId)
  if (found) {
    return res.json(serializeAmbassador(found));
  }
  else {
    return _404(res, "Ambassador not found");
  }
}

function updateAmbassador(req, res) {
  let found = null;
  for (let ambassador of ambassadorsList) {
    if (ambassador.uuid === req.params.ambassadorId) {
      found = ambassador;
    }
  }
  if (found) {
    // we will eventually update the change here
    let updated = {...found, ...req.body}
    return res.json(updated);
  }
  else {
    return _404(res, "Ambassador not found");
  }
}

module.exports = Router({mergeParams: true})
.post('/ambassadors', (req, res) => {
  return createAmbassador(req, res);
})
.get('/ambassadors', (req, res) => {
  return fetchAmbassadors(req, res);
})
.get('/ambassadors/count', (req, res) => {
  return countAmbassadors(req, res);
})
.get('/ambassadors/:ambassadorId', (req, res) => {
  return fetchAmbassador(req, res);
})
.put('/ambassadors/:ambassadorId', (req, res) => {
  return updateAmbassador(req, res);
})
