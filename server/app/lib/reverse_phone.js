/**
 * Wrapper plus some logic around the Twilio Caller ID API.
 * 
 * The function will return the caller-name lookup info.
 * 
 * ref: https://www.twilio.com/docs/lookup/api
 */

import logger from 'logops';
import { international as phoneFormat } from './phone';
import { ov_config } from './ov_config';
import axios from 'axios'; 

module.exports = async (phone) => {
  
  let apiKey = ov_config.ekata_api_key;
  if(!apiKey) {
      logger.info(`[EKATA] Not querying Ekata for ${phoneFormat(phone)} because EKATA_API_KEY not set.`);
      return null;
  }

  logger.info(`[EKATA] Fetching caller info for ${phoneFormat(phone)}`);
  try {
    let response = await axios.get(`https://api.ekata.com/3.1/phone?api_key=${apiKey}&phone=${phoneFormat(phone)}`);
    return response;
  } catch(err) {
    logger.error(`[EKATA] Lookup failed with error ${err}`);
    return null;
  }
};
