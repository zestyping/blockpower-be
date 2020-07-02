function serializeAmbassador(ambassador) {
  let obj = {};
  ['id', 'first_name', 'last_name', 'phone', 'email', 'location', 'signup_completed', 'approved'].forEach(x => obj[x] = ambassador.get(x));
  obj['address'] = ambassador.get('address') !== null ? JSON.parse(ambassador.get('address')) : null;
  obj['quiz_results'] = ambassador.get('quiz_results') !== null ? JSON.parse(ambassador.get('quiz_results')) : null;

  return obj
}

function serializeNeo4JAmbassador(ambassador) {
  let obj = {
    id: ambassador.id,
    first_name: ambassador.first_name,
    last_name: ambassador.last_name,
    signup_completed: ambassador.signup_completed,
    approved: ambassador.approved,
    phone: ambassador.phone,
    email: ambassador.email
  };
  delete ambassador.created_at
  delete ambassador.location
  ambassador.address = JSON.parse(ambassador.address)
  ambassador.quiz_results = ambassador.quiz_results ? JSON.parse(ambassador.quiz_results) : null
  return ambassador
}

function serializeTripler(tripler) {
  let obj = {};
  ['id', 'first_name', 'last_name', 'status', 'phone', 'location', 'email'].forEach(x => obj[x] = tripler.get(x));
  obj['address'] = tripler.get('address') !== null ? JSON.parse(tripler.get('address')) : null;
  obj['triplees'] = tripler.get('triplees') !== null ? JSON.parse(tripler.get('triplees')) : null;
  return obj
}

function serializeNeo4JTripler(tripler) {
  let obj = {
    id: tripler.id,
    first_name: tripler.first_name,
    last_name: tripler.last_name,
    status: tripler.status,
    phone: tripler.phone,
    email: tripler.email
  };
  delete tripler.created_at
  delete tripler.location
  tripler.address = JSON.parse(tripler.address)
  return tripler
}


module.exports = {
  serializeAmbassador: serializeAmbassador,
  serializeNeo4JAmbassador: serializeNeo4JAmbassador,
  serializeTripler: serializeTripler,
  serializeNeo4JTripler: serializeNeo4JTripler
};
