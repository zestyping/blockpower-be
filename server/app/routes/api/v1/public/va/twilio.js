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
  try {
    if (tripler) {
      if (response === 'yes') {
        await triplerSvc.confirmTripler(tripler.get('id'));
      }
      else if (response === 'no') {
        await triplerSvc.detachTripler(tripler.get('id'));
      }
      else {
        await triplerSvc.reconfirmTripler(tripler.get('id'));
      }
    }
    else {
      req.logger.error("Tripler not found", sender);
    }
  }
  catch(err) {
    req.logger.error(`Error while processing response ${response} from sender ${sender}: ${err}`);
  }

  return res.send({});
})