#!/bin/bash

# // Note: the following file relates to the [HelloVoter](https://github.com/OurVoiceUSA/HelloVoter) app, not the BlockPower app, which is built on top of HelloVoter.

set -ex

cd $(dirname $0)

rm -rf node_modules package-lock.json
ncu -u
npm install

# fix server java@0.9.1 problem
rm -f package-lock.json
npm install

CI=true npm test

# build client & server via docker
docker build --pull -t ourvoiceusa/hellovoterapi .

