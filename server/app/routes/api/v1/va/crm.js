import { Router } from 'express'
import fetch from 'node-fetch';
import { ov_config } from '../../../../lib/ov_config';
import { error } from '../../../../services/errors'

/**
 * Handler function to retrieve a visitor token from HubSpot
 *
 * @param {Request} req the request
 * @param {String} req.body.email user email address
 * @param {String|undefined} req.body.firstName (Optional) user first name
 * @param {String|undefined} req.body.lastName (Optional) user last name
 * @param {Response} res the response
 * @returns {Promise} Promise with response or error
 */
async function generateToken(req, res) {
  if (!req.authenticated) {
    return error(401, res, 'Permission denied.')
  }
  if (!req.user) {
    return error(400, res, 'User not available in request');
  }

  const url = `https://api.hubapi.com/conversations/v3/visitor-identification/tokens/create?hapikey=${ov_config.hubspot_api_key}`;
  const options = {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      email: req.user.get('email'),
      firstName: req.user.get('first_name'),
      lastName: req.user.get('last_name')
    }),
    json: true
  };

  try {
    const tokenResponse = await fetch(url, options);
    const tokenJson = await tokenResponse.json();
    if (tokenJson.status === 'error') {
      throw new Error(tokenJson.message);
    }
    return res.json(tokenJson);
  } catch (e) {
    return error(500, res, `Error retrieving token: ${e.message}`);
  }
}

module.exports = Router({ mergeParams: true })
  .get('/crm/token', generateToken);
