
import neo4j from 'neo4j-driver';
import BoltAdapter from 'node-neo4j-bolt-adapter';
import { ov_config } from './ov_config';

/*
 *
 * This class determines the neo4j database, by way of the neo4j-driver, which is used in very few places relating to BlockPower, but is used throughout in HelloVoter
 *
 */
export default class db {

  constructor(config) {
    this.config = config;

    // async'ify neo4j
    const authToken = neo4j.auth.basic(this.config.neo4j_user, this.config.neo4j_password);
    this.db = new BoltAdapter(neo4j.driver(`${ov_config.neo4j_protocol}://`+this.config.neo4j_host+':'+this.config.neo4j_port, authToken), neo4j, { encrypted: 'ENCRYPTION_' + ov_config.neo4j_encryption });
  }

  async dbwrap() {
      var params = Array.prototype.slice.call(arguments);
      var func = params.shift();
      if (this.config.DEBUG) {
        let funcName = func.replace('Async', '');
        console.log('DEBUG: '+funcName+' '+params[0]+';');
        if (params[1]) {
          let str = "";
          str += JSON.stringify(params[1]);
          console.log('DEBUG: :params '+str.substring(0, 1024));
        }
      }
      return this.db[func](params[0], params[1], params[2]);
  }

  async query(q, p, d) {
    try {
      return await this.dbwrap('cypherQueryAsync', q, p, d);
    } catch (e) {
      console.warn({q,p,d});
      throw e;
    }
  }

  close() {
    this.db.close();
  }

  async version() {
    if (this.config.disable_apoc !== false) return null;
    return ((await this.query('call apoc.monitor.kernel() yield kernelVersion return split(split(kernelVersion, ",")[1], " ")[2]'))).data[0];
  }

  async size() {
    if (this.config.disable_apoc !== false) return null;
    return ((await this.query('CALL apoc.monitor.store() YIELD totalStoreSize return totalStoreSize'))).data[0];
  }

}
