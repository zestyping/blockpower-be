function serializeTripler(tripler) {
  let obj = {};
  ['id', 'first_name', 'last_name', 'status', 'ambassador_id', 'phone', 'email', 'latitude', 'longitude'].forEach(x => obj[x] = tripler.get(x));
  obj['address'] = tripler.get('address') !== null ? JSON.parse(tripler.get('address')) : null;
  obj['triplees'] = tripler.get('triplees') !== null ? JSON.parse(tripler.get('triplees')) : null;
  return obj
}

module.exports = {
  serializeTripler: serializeTripler
};