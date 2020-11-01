import { internationalNumber } from "./normalizers";
import { ov_config } from "./ov_config";
import { getTwilioClient } from './twilio';

const client = getTwilioClient();

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
