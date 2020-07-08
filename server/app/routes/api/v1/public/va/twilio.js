import { Router } from 'express';
import triplerSvc from '../../../../../services/triplers';
import { normalize } from '../../../../../lib/phone';

module.exports = Router({mergeParams: true})
.post('/sms/receive', async (req, res) => {
  
  let sender = normalize(req.body.From);
  let response = req.body.Body.toLowerCase();
  
  if (process.env.TWILIO_SUPPORT_PROXY_RESPONSE === 'true') {
    let arr = response.split('=>').map((entry)=>entry.trim()).filter((entry)=>entry.length > 0)
    response = arr[0];
    if (arr.length > 1) {
      sender = normalize(arr[1]);
    }
  }

  let tripler = await triplerSvc.findByPhone(sender);
  if (tripler) {
    if (response !== 'yes') {
      req.logger.error("Tripler has not responded yes", sender, tripler.get('id'), response);
      return res.send({});
    }

    try {
      await triplerSvc.confirmTripler(tripler.get('id'));
    } catch(err) {
      req.logger.error("Invalid tripler or status, cannot confirm", sender, tripler.get('id'), err);
    }
  }
  else {
    req.logger.error("Tripler not found", sender);
  }

  return res.send({});
})