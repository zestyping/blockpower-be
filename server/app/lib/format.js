function formatNumber(number) {
  return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(number);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {dateStyle: 'medium', timeStyle: 'medium'}).format(date);
}

module.exports = {
  formatNumber: formatNumber,
  formatDate: formatDate
};