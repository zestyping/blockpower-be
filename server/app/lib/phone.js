import PhoneNumber from 'awesome-phonenumber';


function international(phone) {
  return (new PhoneNumber(phone, 'US')).getNumber( 'international' );
}

function normalize(phone) {
  return international(phone).replace(/[^0-9xX]/g, '')
}

module.exports = {
  normalize: normalize,
  international: international
};
