/**
 * Email related notification utlities
 * 
 * @module notifications/util/mail
 * @see  {@link module:notifications/util} parent module
 */ 

import nodemailer from 'nodemailer';
import smtpTransport from 'nodemailer-smtp-transport';
import { ov_config } from './ov_config';

const transportOptions = {
  service: ov_config.smtp_service,
  host: ov_config.smtp_server,
  secureConnection: ov_config.smtp_use_tls,
  port: ov_config.smtp_port,
  auth: {
    user: ov_config.smtp_user,
    pass: ov_config.smtp_password
  }
};
const transport = nodemailer.createTransport(smtpTransport(transportOptions));

module.exports = async function(to, cc, bcc, subject, body) {
  if (!to || !subject || !body) return;

  let message = { 
    from: ov_config.smtp_from, to: to, cc: cc, 
    bcc: bcc, subject: subject, html:body
  };
  
  if (ov_config.disable_emails) {
    console.log('Bypassing sending mail to: %s, cc: %s, bcc: %s, subject: %s', to, cc || '-', bcc || '-', message.subject);    
  }
  else {
    await transport.sendMail(message);
  }
};
