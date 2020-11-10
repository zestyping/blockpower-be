/*
 *
 * formatNumber(number)
 *
 * This function formats a number as a USD currency value
 *
 */
function formatNumber(number) {
  return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(number);
}

/*
 *
 * formatDate(date)
 *
 * This function expects a date object, and returns a formatted string representing that date.
 *
 */
function formatDate(date) {
  let formatted = new Intl.DateTimeFormat('en-US', {dateStyle: 'medium', timeStyle: 'medium'}).format(date);
  return formatted.split('T')[0];
}

module.exports = {
  formatNumber: formatNumber,
  formatDate: formatDate
};
