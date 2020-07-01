import { Router } from 'express';

import { ov_config } from '../../../../lib/ov_config';

import {
  _400, _401, _403, _404, _500, geoCode, validateEmpty
} from '../../../../lib/utils';

import sampleTripler from './fixtures/tripler.json';
import triplersList from './fixtures/triplers.json';

function _serializeTripler(tripler) {
  let obj = {};
  ['id', 'first_name', 'last_name', 'status', 'ambassador_id', 'phone', 'email', 'location'].forEach(x => obj[x] = tripler.get(x));
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
      location: {
        latitude: parseFloat(coordinates.latitude),
        longitude: parseFloat(coordinates.longitude)
      }
   }

    new_tripler = await req.neode.create('Tripler', obj);
  } catch(err) {
    req.logger.error("Unhandled error in %s: %j", req.url, err);
    return _500(res, 'Unable to create tripler');
  }
  return res.json(_serializeTripler(new_tripler));
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

async function suggestTriplers(req, res) {
  // This doesn't work?
  // let collection = await req.neode.model('Tripler').withinDistance('location', req.user.get('location'), 10);

  // This works
  // let collection = await req.neode.cypher('MATCH (a:Ambassador)-[:CLAIMS]->(t:Tripler) WHERE a.id = $id AND distance(t.location, a.location) <= 10 RETURN t', {id: req.user.get('id')})

  // So does this
  let collection = await req.neode.query()
    .match('a', 'Ambassador')
    .where('a.id', req.user.get('id'))
    .relationship('CLAIMS')
    .to('t', 'Tripler')
    .whereRaw('distance(t.location, a.location) <= 10')
    .return('t')
    .execute()

  // The first way needs just collection (if it worked)
  /*
  let models = [];
  for (var index = 0; index < collection.length; index++) {
    let entry = collection.get(index);
    models.push(_serializeAmbassador(entry))
  }
  */

  // The second two ways need collection.records and their fields
  // NOTE TODO this is not the right structure... we cannot pass this as is.... needs proper serialization
  let models = [];
  for (var index = 0; index < collection.records.length; index++) {
    let entry = collection.records[index]._fields[0].properties;
    models.push(entry)
  }
  return res.json(models);
}

async function fetchClaimedTriplers(req, res) {
  // Find all triplers claimed by the ambassador

  let ambassador = await req.neode.first('Ambassador', 'id', req.user.get('id'));
  if (!ambassador) {
    return _404(res, 'Ambassador not found');
  }

  let triplers = [];
  ambassador.get('claims').forEach((entry) => triplers.push(_serializeTripler(entry.otherNode())));
  return res.json(triplers);
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
        ...{ location: {
          latitude: parseFloat(coordinates.latitude),
          longitude: parseFloat(coordinates.longitude)
        } },
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
  return fetchAllTriplers(req, res);
})
.get('/suggest-triplers', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.');
  return suggestTriplers(req, res);
})
.get('/claimed-triplers', (req, res) => {
  if (!req.user) return _401(res, 'Permission denied.');
  return fetchClaimedTriplers(req, res);
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
