import neode  from '../lib/neode';
import phoneFormat from '../lib/phone';

async function findById(triplerId) {
  return await neode.first('Tripler', 'id', triplerId);
}

async function findByPhone(phone) {
  return await neode.first('Tripler', 'phone', phoneFormat(phone));
}

async function confirmTripler(triplerId) {
  let tripler = null;
  tripler = await neode.first('Tripler', 'id', triplerId);
  if (tripler && tripler.get('status') === 'pending') {
    await tripler.update({ status: 'confirmed' });    
  }
  else {
    throw "Invalid status, cannot confirm";
  }
}
module.exports = {
  findById: findById,
  findByPhone: findByPhone,
  confirmTripler: confirmTripler
};