const neode = require('neode')
  .fromEnv()
  .withDirectory(__dirname + '/../models/va');
  
export default neode;