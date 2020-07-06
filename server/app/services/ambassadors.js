import neode  from '../lib/neode';
import phoneFormat from '../lib/phone';

async function findByExternalId(externalId) {
  return await neode.first('Ambassador', 'external_id', externalId);
}

module.exports = {
  findByExternalId: findByExternalId
};