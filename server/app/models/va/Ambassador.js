module.exports = {
  id: {
    type: 'uuid',
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
    required: true,
    unique: true
  },
  email: 'string',  
  address: {
    type: 'string',
    required: true
  },
  latitude: {
    type: 'float',
    required: true
  },
  longitude: {
    type: 'float',
    required: true
  },
  claims: {
    type: 'relationships',
    relationship: 'CLAIMS',
    direction: 'out',
    target: 'Tripler',
    properties: {
      since: {
        type: 'localdatetime',
        default: () => new Date,
      },
    },
    eager: true
  },
  submitted_form: 'boolean',
  approved: 'boolean',
  quiz_results: 'string',
  created_at: {
    type: 'localdatetime',
    default: () => new Date,
  }
};
