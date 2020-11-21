// Note: the following file relates to the [HelloVoter](https://github.com/OurVoiceUSA/HelloVoter) app, not the BlockPower app, which is built on top of HelloVoter.

import glob from 'glob';

console.warn = function() {};

glob
  .sync('../app/**/*.test.js', { cwd: `${__dirname}/` })
  .map(filename => require(`./${filename}`))
