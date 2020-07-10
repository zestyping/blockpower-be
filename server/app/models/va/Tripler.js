let enforceUnique = process.env.STRESS_TESTING !== 'true';

module.exports = {
  id: {
    type: 'string',
    primary: true
  },
  first_name: {
    type: 'string',
    required: true
  },
  last_name: 'string',
  date_of_birth: 'string',
  phone: {
    type: 'string',
    unique: enforceUnique
  },
  email: 'string',  
  status: 'string',
  address: {
    type: 'string',
    required: true
  },
  location: {
    type: 'point',
    required: true
  },
  triplees: 'string',
  created_at: {
    type: 'localdatetime',
    default: () => new Date,
  },
  knows: {
    type: 'relationships',
    relationship: 'KNOWS',
    target: 'Tripler',
    properties: {
      distance: {
        type: 'float'
      }
    },
    eager: true
  }
};
