import axios from 'axios';

async function findMyIp() {
  try {
    let res = await axios.get('https://api.ipify.org');
    return res.data;
  } catch(err) {
    console.log("ERROR: Could not fetch public IP, not possible to continue", err);
    throw err;
  }
}

let localIP = null;
async function init() {
  localIP = await findMyIp();
  console.log("Server is running on public IP: ", localIP);
}

function ip() {
  return localIP;
}

module.exports = {
  init: init,
  ip: ip
}