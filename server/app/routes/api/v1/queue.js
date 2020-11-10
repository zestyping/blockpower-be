// Note: the following file relates to the [HelloVoter](https://github.com/OurVoiceUSA/HelloVoter) app, not the BlockPower app, which is built on top of HelloVoter.

import {
  cqdo,
} from '../../../lib/utils';

import { Router } from 'express';

module.exports = Router({mergeParams: true})
.get('/queue/list', (req, res) => {
  return cqdo(req, res, 'match (a:QueueTask)<-[:PROCESSED_BY]-(b) return a, labels(b)[0], b{.id,.name,.filename} order by a.created desc', {}, true);
});
