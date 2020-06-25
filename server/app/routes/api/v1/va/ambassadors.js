import { Router } from 'express';

import { ov_config } from '../../../../lib/ov_config';

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

function fetchAmbassadors(req, res) {
  return res.json(ambassadorsList);
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
.get('/ambassadors/:ambassadorId', (req, res) => {
  return fetchAmbassador(req, res);
})
.put('/ambassadors/:ambassadorId', (req, res) => {
  return updateAmbassador(req, res);
})