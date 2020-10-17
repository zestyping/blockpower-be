import { normalize } from './phone';
import { geoCode } from './utils';
import { ValidationError } from './errors';

import neo4j from 'neo4j-driver';

const WGS_84_2D = 4326;

/** This can handle both Ambassadors and Triplers. */
export async function getUserJsonFromRequest(body, allowedAttrs) {
  const json = {};

  for (const prop in body) {
    if (allowedAttrs.indexOf(prop) >= 0) {
      json[prop] = body[prop];
    }
  }

  if (body.phone) {
    json.phone = normalize(body.phone);
  }

  if (body.address) {
    const coordinates = await geoCode(body.address);
    if (!coordinates) {
      throw new ValidationError("Invalid address.");
    }
    json.address = JSON.stringify(body.address, null, 2);
    json.location = new neo4j.types.Point(
      WGS_84_2D,
      coordinates.longitude,
      coordinates.latitude,
    );
  }

  if (body.quiz_results) {
    json.quiz_results = JSON.stringify(body.quiz_results, null, 2);
  }

  if (body.triplees) {
    json.triplees = JSON.stringify(body.triplees, null, 2);
  }
}
