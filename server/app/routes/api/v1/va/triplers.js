import { Router } from 'express';

import { ov_config } from '../../../../lib/ov_config';

import {
  _404
} from '../../../../lib/utils';

import sampleTripler from './fixtures/tripler.json';
import triplersList from './fixtures/triplers.json';
import sampleAmbassador from './fixtures/ambassador.json';
import ambassadorsList from './fixtures/ambassadors.json';
import fetchAmbassador from './ambassadors';

function createTripler(req, res) {
  // validate for duplicate phone
  // assume that all the required data has been provided

  return res.json(sampleTripler);
}

function fetchTriplers(req, res) {
  if (req.query.ambassador_id) {
    return fetchTriplersByAmbassadorId(req, res)
  }
  if (req.query.latitude && req.query.longitude && req.query.radius) {
    return fetchTriplersByLocation(req, res)
  }
}

function fetchTriplersByAmbassadorId(req, res) {
  // Find all triplers claimed by the ambassador
  let filteredList = triplersList.filter((tripler) => {
    return tripler.ambassador_id === req.query.ambassador_id
  })

  if (filteredList.length === 0) {
    return _404(res, "No triplers found for that ambassador ID");
  } else {
    return res.json(filteredList);
  }
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


function fetchTripler(req, res) {
  let found = null;
  for (let tripler of triplersList) {
    if (tripler.uuid === req.params.triplerId) {
      found = tripler;
    }
  }
  if (found) {
    return res.json(found);
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
.get('/triplers', (req, res) => {
  return fetchTriplers(req, res);
})
.get('/triplers/:triplerId', (req, res) => {
  return fetchTripler(req, res);
})
.put('/triplers/:triplerId', (req, res) => {
  return updateTripler(req, res);
})
