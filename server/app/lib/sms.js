import { internationalNumber } from "./normalizers";
import { ov_config } from "./ov_config";
import { getTwilioClient } from './twilio';

const client = getTwilioClient();

/*
 *
 * This module sends an sms via Twilio to the given phone number.
 *
 * NOTE: this implementation expects a Twilio messaging pool via Twilio Messaging Service
 *   and requires the messaging service SID.
 *
 */
module.exports = (to, message) => {
  console.log(`Sending SMS to ${internationalNumber(to)}: ${message}`);

  if (ov_config.twilio_disable) {
    console.log("Bypassing sending SMS");
    return;
  }

  return client.messages.create({
    to: internationalNumber(to),
    messagingServiceSid: ov_config.twilio_msg_svc_sid,
    body: message,
  });
};
