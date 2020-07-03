module.exports = (phone) => {
  return phone.replace(/[^0-9xX]/g, '')
};