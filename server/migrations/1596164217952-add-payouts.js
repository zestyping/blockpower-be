'use strict'

require('dotenv').config();

let neo4j = require('neo4j-driver').v1;
let BoltAdapter = require('node-neo4j-bolt-adapter');
let authToken = neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD);
let db = new BoltAdapter(neo4j.driver('bolt://'+process.env.NEO4J_HOST+':'+process.env.NEO4J_PORT, authToken), neo4j);

module.exports.up = function (next) {
  console.log('starting migration.....');

  let query = `MATCH (a:Ambassador)-[r:EARNS_OFF]->(t:Tripler) MATCH (a)-[:OWNS_ACCOUNT]->(ac:Account) RETURN a, r, t, ac`;

  let createQueries = [];
  let deleteQueries = [];

  let toComplete = 0;

  db.cypherQueryAsync(query).then(result => {
    console.log(`${result.data.length} ambassadors to migrate....`);

    for (let x = 0; x < result.data.length; x++) {
      let fields = result.data[x];
      let ambassador = fields[0];
      let earns_off = fields[1];
      let tripler = fields[2];
      let account = fields[3];

      let old = earns_off.disbursed_at;
      let disbursed_at = old ? new Date(old.year, old.month, old.day, old.hour, old.minute, old.second, old.nanosecond).toISOString() : null;
      old = earns_off.settled_at;
      let settled_at = old ? new Date(old.year, old.month, old.day, old.hour, old.minute, old.second, old.nanosecond).toISOString() : null;
      old = earns_off.since;
      let since = new Date(old.year, old.month, old.day, old.hour, old.minute, old.second, old.nanosecond).toISOString();

      createQueries.push(`
      MATCH (a:Ambassador {id: "${ambassador.id}"})-[:OWNS_ACCOUNT]->(ac:Account)
      CREATE (a)-[r:GETS_PAID {tripler_id: "${tripler.id}"}]->(p:Payout {
        amount: ${earns_off.amount},
        disbursement_id: "${earns_off.disbursement_id}",
        disbursed_at: datetime(${disbursed_at ? '"' + disbursed_at + '"' : null}),
        settlement_id: ${earns_off.settlement_id ? '"' + earns_off.settlement_id + '"' : null},
        settled_at: datetime(${settled_at ? '"' + settled_at + '"': null}),
        status: "${earns_off.status}",
        since: datetime("${since}"),
        error: ${earns_off.error ? "'" + earns_off.error + "'" : null}
      })-[:TO_ACCOUNT]->(ac)`);

      deleteQueries.push(`MATCH (a:Ambassador {id: "${ambassador.id}"})-[r:EARNS_OFF]->(t:Tripler {id: "${tripler.id}"}) DETACH DELETE r`);

      toComplete += 2;
    }
  })
  .then(() => {
    for (let x = 0; x < createQueries.length; x++) {
      db.cypherQueryAsync(createQueries[x]).then(() => {
        toComplete--;
        console.log('creating payout');
        if (toComplete < 1) {
          console.log('.... finished migration');
          next();
        }
      }).catch((err) => {
        console.log('error creating payout: ', err);
      });
    }
  })
  .then(() => {
    for (let x = 0; x < deleteQueries.length; x++) {
      db.cypherQueryAsync(deleteQueries[x]).then(() => {
        toComplete--;
        console.log('deleting earns_off relationship');
        if (toComplete < 1) {
          console.log('.... finished migration');
          next();
        }
      }).catch((err) => {
        console.log('error deleting earns_off relationship: ', err);
      });
    }
  })
  .catch((err) => {
    console.log('error with migration', err);
    next();
  });
}

module.exports.down = async function (next) {
}

