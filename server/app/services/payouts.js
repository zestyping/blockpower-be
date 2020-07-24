import neode  from '../lib/neode';

async function send(ambassador, tripler) {
  // pending => initiated => completed

  let obj = tripler.get('claimed');
  if (obj === null || obj.get('id') !== ambassador.get('id')) {
    throw 'Invalid relationship, cannot pay';
  }

  let status = tripler.get('status');
  if (status !== 'confirmed') {
    throw 'Invalid tripler status, cannot pay';
  }

  let query = `MATCH (a:Ambassador{id: \'${ambassador.get('id')}\'})-[r:EARNS_OFF]->(t:Tripler{id: \'${tripler.get('id')}\'}) RETURN r`;
  let res = await neode.cypher(query);
  if (res.records.length > 0) {
    let properties = res.records[0]._fields[0].properties;
    if (properties.status !== 'pending') {
      throw 'Ambassador has an existing payment history with the tripler, cannot pay';
    }
  } 

  ambassador.relateTo(tripler, 'earns_off', { status: 'pending' });

  // TODO send money via Stripe
  // see what error can come, parse error codes, or sTore error message

  // TODO fetch amount from configuration
  ambassador.relateTo(tripler, 'earns_off', { status: 'initiated', initiated_at: new Date(), amount: 5000 });

  // TODO see if payment is instant, or result is sent via webhook or we need to poll
  // TODO accordingly, set the status to completed when done, and updated completed_at, or store errors
}

function retry() {

}

module.exports = {
  send: send
};
