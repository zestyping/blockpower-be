function formatNumber(number) {
  return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(number);
}

function formatDate(date) {
  let formatted = new Intl.DateTimeFormat('en-US', {dateStyle: 'medium', timeStyle: 'medium'}).format(date);
  return formatted.split('T')[0];
}

module.exports = {
  formatNumber: formatNumber,
  formatDate: formatDate
};
