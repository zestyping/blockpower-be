import logger from "logops";
import { international as phoneFormat } from "./phone";
import { ov_config } from "./ov_config";
import { getTwilioClient } from './twilio';

const client = getTwilioClient();

module.exports = (to, message) => {
  logger.debug(`Sending SMS to ${phoneFormat(to)}: ${message}`);

  if (ov_config.twilio_disable) {
    logger.debug("Bypassing sending SMS");
    return;
  }

  return client.messages.create({
    from: ov_config.twilio_from,
    to: phoneFormat(to),
    body: message,
  });
};
