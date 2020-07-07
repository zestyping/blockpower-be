import PhoneNumber from 'awesome-phonenumber';
import EmailValidator from 'email-validator';

function _isEmpty(obj) {
  if (!obj) return true;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  if (typeof obj === 'string') return !(obj.trim());
  return false;
}

export function validateEmpty(obj, keys) {
  if (_isEmpty(obj)) return false;
  for (var i = 0; i < keys.length; i++) {
    if (_isEmpty(obj[keys[i]])) return false;
  }
  return true;
}

export function validatePhone(phone) {
  return (new PhoneNumber(phone, 'US')).isValid();
}

export function validateEmail(email) {
  return EmailValidator.validate(email);
}