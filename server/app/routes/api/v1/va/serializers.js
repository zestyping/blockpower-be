function _displayAddress(address) {
  if (!address) return '';
  let keys = [ 'address1', 'city', 'state', 'zip' ];
  let values = [];
  keys.forEach((key)=>{if (address[key]) values.push(address[key])});
  return values.join(", ");
}

function serializeAmbassador(ambassador) {
  let obj = {};
  ['id', 'external_id', 'first_name', 'last_name', 'phone', 'email', 'location', 'signup_completed', 'approved', 'locked'].forEach(x => obj[x] = ambassador.get(x));
  obj['address'] = !!ambassador.get('address') ? JSON.parse(ambassador.get('address')) : null;
  obj['display_address'] = !!obj['address'] ? _displayAddress(obj['address']) : null;
  obj['quiz_results'] = !!ambassador.get('quiz_results') ? JSON.parse(ambassador.get('quiz_results')) : null;

  return obj
}

function serializeTripler(tripler) {
  let obj = {};
  ['id', 'first_name', 'last_name', 'status', 'phone', 'location', 'email'].forEach(x => obj[x] = tripler.get(x));
  obj['address'] = !!tripler.get('address') ? JSON.parse(tripler.get('address')) : null;
  obj['display_address'] = !!obj['address'] ? _displayAddress(obj['address']) : null;
  obj['triplees'] = !!tripler.get('triplees') ? JSON.parse(tripler.get('triplees')) : null;
  return obj
}

function serializeNeo4JTripler(tripler) {
  let obj = {};
  ['id', 'first_name', 'last_name', 'status', 'phone', 'location', 'email'].forEach(x => obj[x] = tripler[x]);
  obj['address'] = !!tripler.address ? JSON.parse(tripler.address) : null;
  obj['triplees'] = !!tripler.triplees ? JSON.parse(tripler.triplees) : null;
  return obj;
}


module.exports = {
  serializeAmbassador: serializeAmbassador,
  serializeTripler: serializeTripler,
  serializeNeo4JTripler: serializeNeo4JTripler
};
