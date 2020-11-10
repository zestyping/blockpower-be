import { ov_config } from './ov_config';

/*
 *
 * getTwilioClient()
 *
 * this function simply provides the twilio client, passing in the account SID and auth token as given in .env
 *
 */
export function getTwilioClient() {
  if (process.env.NODE_ENV !== "production" && !ov_config.twilio_account_sid) {
    console.log('[TWILIO] Not enabled. Configure your .env file if you want to use it.');
    return null;
  }

  return require('twilio')(ov_config.twilio_account_sid, ov_config.twilio_auth_token, {
    lazyLoading: true
  });
}
