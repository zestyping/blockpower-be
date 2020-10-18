#!/usr/bin/env node

import faker from 'faker';
import { geoCode } from '../app/lib/utils.js';
import { v4 as uuidv4 } from 'uuid';
import neode from '../app/lib/neode.js';
import addresses from './seed_data/addresses.json';
import { normalizePhone } from '../app/lib/normalizers';
import yargs from 'yargs';

const argv = yargs
  .scriptName("seed_db.js")
  .usage('$0 <cmd> [options]')
  .command('seedall', 'seed with random Ambassadors and Triplers, optionally delete all first', async function (argv) {
    try {
      await seed(argv.argv);
      process.exit(0);
    } catch (err) {
      console.log(err);
      process.exit(1);
    }
  })
  .command('delete', 'only delete all the Ambassadors and Triplers, do not seed', async function () {
    try {
      await emptyDatabase();
      process.exit(0);
    } catch (err) {
      console.log(err);
      process.exit(1);
    }
  })
  .option({
    'max-ambassadors': {
      alias: 'ma',
      describe: 'defines a maximum number of Ambassadors to create',
      type: 'number'
    }
  })
  .option({
    'max-triplers': {
      alias: 'mt',
      describe: 'defines a maximum number of Triplers to create',
      type: 'number'
    }
  })
  .option({
    'empty': {
      describe: 'empty the database before you seed it',
      type: 'boolean'
    }
  })
  .option({
    'seed': {
      describe: 'define a random number generation seed to reproduce a state',
      type: 'number'
    }
  })
  .option({
    'force-unconfirmed': {
      describe: 'force all triplers to be created with "unconfirmed" status',
      type: 'boolean'
    }
  })
  .help()
  .argv

async function randomPhone(model) {
  while (true) {
    let phone = normalizePhone(faker.phone.phoneNumber());
    let entry = await neode.first(model, 'phone', phone);
    if (!entry) return phone;
  }
}

async function emptyDatabase() {
  console.log("Emptying database...");
  await neode.deleteAll('Ambassador');
  await neode.deleteAll('Tripler');
}

async function baseUserData() {
  const address = addresses[faker.random.number({ min: 0, max: addresses.length - 1 })];
  const coordinates = await geoCode(address);
  const user = {
    id: uuidv4(),
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    gender: faker.random.arrayElement(['F', 'M', 'U']),
    phone: await randomPhone('Ambassador'),
    age_decade: faker.random.arrayElement(["20-29", "30-39", "40-49"]),
    email: faker.internet.email(),
    address: JSON.stringify(address),
    zip: address.zip,
    msa: `${address.state} other`,
    location: {
      latitude: parseFloat(coordinates.latitude),
      longitude: parseFloat(coordinates.longitude)
    },
  };
  return {
    ...user,
    full_name: `${user.first_name} ${user.last_name}`,
  }
}

async function createTripler({ status }) {
  let json = {
    ...await baseUserData(),
    status: argv['force-unconfirmed'] ? 'unconfirmed' : status,
    triplees: JSON.stringify([
      faker.name.findName(),
      faker.name.findName(),
      faker.name.findName(),
    ]),
  }
  return neode.create('Tripler', json);
}

async function createAmbassador(opts) {
  let json = {
    ...await baseUserData(),
    quiz_results: null,
    approved: !!opts.approved,
    locked: !!opts.locked,
    signup_completed: !!opts.signup_completed,
    admin: !!opts.admin,
  };

  let new_ambassador = await neode.create('Ambassador', json);
  if (opts.createTriplers) {
    let statuses = ['pending', 'unconfirmed', 'confirmed'];
    let status = statuses[faker.random.number({ min: 0, max: 2 })];
    let max = faker.random.number({ min: 1, max: 2 });
    for (let index = 0; index < max; index++) {
      console.log(`Creating ${status} tripler ${index + 1} of ${max} ...`);
      let tripler = await createTripler({ status });
      await new_ambassador.relateTo(tripler, 'claims');
    }
  }
  return new_ambassador;
}

async function createAdmin() {
  return createAmbassador({ admin: true });
}

async function seed(argv) {
  const randomSeed = argv.seed || 2020;
  console.log(`starting seed_db with seed: ${randomSeed}`);

  faker.seed(randomSeed);

  if (argv.empty) {
    await emptyDatabase();
  }

  console.log("Creating admin...");
  let admin = await createAdmin();
  console.log(`Admin created with email ${admin.get('email')}`);

  console.log("Creating approved ambassador...");
  let ambassador = await createAmbassador({ approved: true, signupCompleted: true, createTriplers: true });
  console.log(`Ambassador created with email ${ambassador.get('email')}`);

  console.log("Creating unapproved ambassador...");
  ambassador = await createAmbassador({ approved: false, signupCompleted: false, createTriplers: false });
  console.log(`Ambassador created with email ${ambassador.get('email')}`);

  console.log("Creating locked ambassador...");
  ambassador = await createAmbassador({ locked: true, approved: true, signupCompleted: true, createTriplers: true });
  console.log(`Ambassador created with email ${ambassador.get('email')}`);

  // Create some number of ambassadors (random btw 1 - 10 if not specified in args)
  let max = argv['max-ambassadors'] || faker.random.number({ min: 1, max: 10 });
  for (let index = 0; index < max; index++) {
    let approved = faker.random.boolean();
    let locked = faker.random.boolean();
    let signupCompleted = faker.random.boolean();

    console.log(`Creating {locked: ${locked}, approved: ${approved}, signup_completed: ${signupCompleted}} ambassador ${index + 1} of ${max} ...`);
    let ambassador = await createAmbassador({ createTriplers: true });

    console.log(`Ambassador created with email ${ambassador.get('email')}`);
  }

  // Create some number of triplers (random btw 1 - 30 if not specified in args)
  max = argv['max-triplers'] || faker.random.number({ min: 1, max: 30 });
  let statuses = ['pending', 'unconfirmed', 'confirmed'];
  let status = statuses[faker.random.number({ min: 0, max: 2 })];
  for (let index = 0; index < max; index++) {
    console.log(`Creating ${status} tripler ${index + 1} of ${max} ...`);
    await createTripler({ status });
  }
}
