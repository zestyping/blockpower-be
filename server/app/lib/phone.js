import PhoneNumber from 'awesome-phonenumber';

function normalize(phone) {
  if (phone[0] === '1') {
    phone = phone.substr(1);
  }
  return phone.replace(/[^0-9xX]/g, '')
}

function international(phone) {
  return (new PhoneNumber(phone, 'US')).getNumber( 'international' );
}

module.exports = {
  normalize: normalize,
  international: international
};
