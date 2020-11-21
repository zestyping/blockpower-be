// Note: the following file relates to the [HelloVoter](https://github.com/OurVoiceUSA/HelloVoter) app, not the BlockPower app, which is built on top of HelloVoter.

import keypair from 'keypair';
import fs from 'fs';

function genkeys() {
  let gen = false;

  try {
    fs.readFileSync('./test/rsa.pub');
    fs.readFileSync('./test/rsa.key');
    console.log("RSA keypair already exists, not generating a new one.");
  } catch (e) {
    gen = true;
  }

  if (gen) {
    console.log("Generating new RSA keypair...");
    var pair = keypair();
    fs.writeFileSync("./test/rsa.pub", pair.public);
    fs.writeFileSync("./test/rsa.key", pair.private);
    console.log("RSA keypair generation complete!")
  }
}

genkeys();
