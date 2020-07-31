'use strict'
import neode  from '../app/lib/neode';

module.exports.up = async function (next) {
  let query = `MATCH (a:Ambassador)-[r:EARNS_OFF]->(t:Tripler) MATCH (a)-[:OWNS_ACCOUNT]->(ac:Account) RETURN a, r, t, ac`;
  let res = await neode.cypher(query);

  for (let x = 0; x < res.records.length; x++) {
    let fields = res.records[x]._fields;
    let ambassador = fields[0];
    let earns_off = fields[1];
    let tripler = fields[2];
    let account = fields[3];

    let disbursed_at = new Date(earns_off.properties.disbursed_at.toString());
    let settled_at = new Date(earns_off.properties.settled_at.toString());
    let since = new Date(earns_off.properties.since.toString());

    let query2 = `
    MATCH (a:Ambassador {id: "${ambassador.properties.id}"})-[:OWNS_ACCOUNT]->(ac:Account)
    CREATE (a)-[r:GETS_PAID {tripler_id: "${tripler.properties.id}"}]->(p:Payout {
      amount: ${earns_off.properties.amount},
      disbursement_id: "${earns_off.properties.disbursement_id}",
      disbursed_at: datetime(${earns_off.properties.disbursed_at ? '"' + earns_off.properties.disbursed_at.toString() + '"': null}),
      settlement_id: "${earns_off.properties.settlement_id}",
      settled_at: datetime(${earns_off.properties.settled_at ? '"' + earns_off.properties.settled_at.toString() + '"' : null}),
      status: "${earns_off.properties.status}",
      since: datetime("${earns_off.properties.since.toString()}"),
      error: ${earns_off.properties.error ? '"' + earns_off.properties.error + '"' : null}
    })-[:TO_ACCOUNT]->(ac)`;

    res = await neode.cypher(query2);

    let query3 = `MATCH (a:Ambassador {id: "${ambassador.properties.id}"})-[r:EARNS_OFF]->(t:Tripler {id: "${tripler.properties.id}"}) DETACH DELETE r`;

    res = await neode.cypher(query3);
  }
}

module.exports.down = async function (next) {
}
