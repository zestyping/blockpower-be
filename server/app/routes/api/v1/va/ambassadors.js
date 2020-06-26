import { Router } from 'express';

import {
  _404
} from '../../../../lib/utils';

import sampleAmbassador from './fixtures/ambassador.json';
import ambassadorsList from './fixtures/ambassadors.json';

function createAmbassador(req, res) {
  // validate for duplicate email and duplicate phone
  // assume that all the required data has been provided

  return res.json(sampleAmbassador);
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
    let obj = {};
    ['id', 'first_name', 'last_name', 'phone', 'email', 'latitude', 'longitude'].forEach(x => obj[x] = entry.get(x));
    obj['address'] = entry.get('address') !== null ? JSON.parse(entry.get('address')) : null;
    obj['quiz_results'] = entry.get('quiz_results') !== null ? JSON.parse(entry.get('quiz_results')) : null;
    models.push(obj);
  }
  return res.json(models);
}

function fetchAmbassador(req, res) {
  let found = null;
  for (let ambassador of ambassadorsList) {
    if (ambassador.uuid === req.params.ambassadorId) {
      found = ambassador;
    }
  }
  if (found) {
    return res.json(found);
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