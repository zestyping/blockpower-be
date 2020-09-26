import { Router } from 'express';

import {
  _401
} from '../../../../lib/utils';

import { serializeAmbassador, serializeTripler, serializePayout } from './serializers.js';
import { ov_config } from '../../../../lib/ov_config';
import { exportAmbassadors, exportTriplers } from '../../../../services/export';

module.exports = Router({mergeParams: true})
.get('/csv-export/ambassadors', async (req, res) => {
  if (!req.authenticated) return _401(res, 'Permission denied.')

  let csv = await exportAmbassadors(req.neode);

  return res.send(csv)
})
.get('/csv-export/triplers', async (req, res) => {
  if (!req.authenticated) return _401(res, 'Permission denied.')

  let csv = await exportTriplers(req.neode);

  return res.send(csv)
})
