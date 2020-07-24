let enforceUnique = process.env.STRESS_TESTING !== 'true';

module.exports = {
  id: {
    type: 'uuid',
    primary: true
  },
  account_type: {
    type: 'string',
    required: true
  },
  account_id: {
    type: 'string',
    required: true
  }
};
