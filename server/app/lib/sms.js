import logger from "logops";
import { internationalNumber } from "./normalizers";
import { ov_config } from "./ov_config";
import { getTwilioClient } from './twilio';

const client = getTwilioClient();

module.exports = (to, message) => {
  logger.debug(`Sending SMS to ${internationalNumber(to)}: ${message}`);

  if (ov_config.twilio_disable) {
    logger.debug("Bypassing sending SMS");
    return;
  }

  return client.messages.create({
    to: internationalNumber(to),
    messagingServiceSid: ov_config.twilio_msg_svc_sid,
    body: message,
  });
};
