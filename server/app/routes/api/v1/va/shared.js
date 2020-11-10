import { Router } from 'express';

import { ov_config } from '../../../../lib/ov_config';

import {
  _400, _401, geoCode
} from '../../../../lib/utils';

async function checkAddress(req, res) {
  if (!req.body.address) {
    return _400(res, "Address not provided");
  }

  let coordinates = await geoCode(req.body.address);
  return res.json({ valid: coordinates !== null });
}

module.exports = Router({ mergeParams: true })
  /*
   *
   * This route simply determines if an address is valid according to the census.gov geocoder
   *
   */
  .post('/shared/check-address', (req, res) => {
    if (!req.user) return _401(res, 'Permission denied.')
    return checkAddress(req, res);
  })
  /*
   *
   * This route is used by the frontend and the admin panel to display the organization name for the API they are talking to
   *
   */
  .get('/shared/orgname', (req, res) => {
    if (!req.user) return _401(res, 'Permission denied.')
    return res.json({ orgname: ov_config.organization_name });
  });
