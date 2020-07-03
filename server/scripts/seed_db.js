import dotenv from 'dotenv';
import { getConfig } from '../app/lib/common';
import { geoCode } from '../app/lib/utils.js';
import faker from 'faker';
import addresses from './seed_data/addresses.json';
import fetch from 'node-fetch';

dotenv.config();

const API_BASE = '/api/v1/va/';
const MAX_TRIPLERS = 30;
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': getConfig("SEED_TOKEN")
}
async function seed() {
  let adminJson = {
    first_name: faker.name.findName(),
    address: addresses[0],
    phone: "+11001001000"
  };

  let response = await fetch(getConfig("SEED_HOST") + API_BASE + 'ambassadors/signup', {
    method: 'post',
    body: JSON.stringify(adminJson),
    headers: HEADERS
  });

  let admin = await response.json();

  await fetch(getConfig("SEED_HOST") + API_BASE + 'ambassadors/' + admin.id + '/admin', {
    method: 'put',
    body: JSON.stringify(admin),
    headers: HEADERS
  });

  for (let x = 0; x < MAX_TRIPLERS; x++) {
    let randomName = faker.name.findName();
    let randomEmail = faker.internet.email();
    let randomAddress = addresses[x%MAX_TRIPLERS];
    let coordinates = await geoCode(randomAddress);
    let tripler = {
      first_name: randomName,
      email: randomEmail,
      address: randomAddress,
      status: "unconfirmed",
      phone: "replace this with a valid phone #" + Math.random()
    }

    await fetch(getConfig("SEED_HOST") + API_BASE + 'triplers', {
      method: 'post',
      body: JSON.stringify(tripler),
      headers: HEADERS
    })
  }
}

seed()
