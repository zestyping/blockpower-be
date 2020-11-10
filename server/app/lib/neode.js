/*
 *
 * This constant is the main neode object used throughout the BlockPower app, and not used at all in the HelloVoter app.
 *
 * Several env vars are picked up by the .fromEnv() function, such as NEO4J_HOST, and others.
 * This object is often exposed by being attached to the node res object. Sometimes it is referenced directly
 *
 */
const neode = require('neode')
  .fromEnv()
  .withDirectory(__dirname + '/../models/va');
  
export default neode;
