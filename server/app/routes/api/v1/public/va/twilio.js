import { Router } from 'express';
import logger from 'logops';
import triplersSvc from '../../../../../services/triplers';

module.exports = Router({mergeParams: true})
.post('/sms/receive', async (req, res) => {
  let tripler = await triplersSvc.findByPhone(req.body.From);
  if (tripler) {
    let response = req.body.Body.toLowerCase();
    if (response !== 'yes') {
      logger.error("Tripler has not responded yes", req.body.From, tripler.get('id'), response);
      return res.send({});
    }

    try {
      await triplersSvc.confirmTripler(tripler.get('id'));
    } catch(err) {
      logger.error("Invalid tripler or status, cannot confirm", req.body.From, tripler.get('id'), err);
    }
  }
  else {
    logger.error("Tripler not found", req.body.From);
  }

  return res.send({});
})