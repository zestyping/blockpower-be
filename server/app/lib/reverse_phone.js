/**
 * Wrapper plus some logic around the Ekata reverse phone API.
 *
 * ref: https://ekata.com/developer/documentation/api-overview/#tag/Reverse-Phone-API
 */

import { internationalNumber } from './normalizers';
import { ov_config } from './ov_config';
import axios from 'axios';
import { getTwilioClient } from './twilio';

const client = getTwilioClient();

module.exports = async (phone) => {

  let apiKey = ov_config.ekata_api_key;
  let addon = ov_config.ekata_addon;
  if(ov_config.twilio_disable) {
    console.log(`[EKATA] Caller info lookup skipped TWILIO_DISABLE is set in env.`);
    let result = new Promise((resolve, reject) => {
      resolve();
    });
    return result;
  }
  if(!apiKey && !addon) {
    console.log(`[EKATA] Not querying Ekata for ${internationalNumber(phone)} because EKATA_API_KEY not set and EKATA_ADDON not TRUE.`);

    let result = new Promise((resolve, reject) => {
      resolve();
    });
    return result;
  }

  console.log(`[EKATA] Fetching caller info for ${internationalNumber(phone)}`);
  try {
    let response;
    if (apiKey) {
      response = await axios.get(`https://api.ekata.com/3.1/phone?api_key=${apiKey}&phone=${internationalNumber(phone)}`);
    } else if (addon) {
      response = await client.lookups.phoneNumbers(internationalNumber(phone))
        .fetch({addOns: ['ekata_reverse_phone']})
    }
    return response;
  } catch(err) {
    console.log(`[EKATA] Lookup failed with error ${err}`);
    return null;
  }
};
