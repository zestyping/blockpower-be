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
  status: 'string',
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
  triplees: 'string',
  created_at: {
    type: 'localdatetime',
    default: () => new Date,
  }
};
