import neode  from '../lib/neode';

async function findByExternalId(externalId) {
  return await neode.first('Ambassador', 'external_id', externalId);
}

module.exports = {
  findByExternalId: findByExternalId
};
