
import { ov_config } from '../app/lib/ov_config';
import neo4j from '../app/lib/neo4j';

/*
 *
 * Note: this file was a convenience function for testing / admin purposes. It is considered obsolete
 *
 */
async function makeadmin(id) {
  let db = new neo4j(ov_config);
  await db.query("match (v:Ambassador {id:{id}}) set v.admin = true", {id: id});
  db.close();
}

var args = JSON.parse(process.env.npm_config_argv);

makeadmin(args.remain[0]);

