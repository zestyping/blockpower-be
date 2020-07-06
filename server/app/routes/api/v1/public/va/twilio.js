import { Router } from 'express';
import logger from 'logops';
import triplerSvc from '../../../../../services/triplers';

module.exports = Router({mergeParams: true})
.post('/sms/receive', async (req, res) => {
  
  let sender = req.body.From;
  let response = req.body.Body.toLowerCase();
  
  if (process.env.TWILIO_SUPPORT_PROXY_RESPONSE === 'true') {
    let arr = response.split('=>').map((entry)=>entry.trim()).filter((entry)=>entry.length > 0)
    response = arr[0];
    if (arr.length > 1) {
      sender = arr[1];
    }
  }

  let tripler = await triplerSvc.findByPhone(sender);
  if (tripler) {
    if (response !== 'yes') {
      logger.error("Tripler has not responded yes", sender, tripler.get('id'), response);
      return res.send({});
    }

    try {
      await triplerSvc.confirmTripler(tripler.get('id'));
    } catch(err) {
      logger.error("Invalid tripler or status, cannot confirm", sender, tripler.get('id'), err);
    }
  }
  else {
    logger.error("Tripler not found", sender);
  }

  return res.send({});
})