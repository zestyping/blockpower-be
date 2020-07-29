let enforceUnique = process.env.STRESS_TESTING !== 'true';

module.exports = {
  id: {
    type: 'uuid',
    primary: true
  },
  external_id: {
    type: 'string',
    unique: enforceUnique
  },
  first_name: {
    type: 'string',
    required: true
  },
  last_name: {
    type: 'string',
    required: true
  },
  date_of_birth: 'string',
  phone: {
    type: 'string',
    unique: enforceUnique,
    required: true
  },
  email: {
    type: 'string',
    unique: enforceUnique
  },
  address: {
    type: 'string',
    required: true
  },
  location: {
    type: 'point',
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
  signup_completed: {
    type: 'boolean',
    default: false
  },
  onboarding_completed: {
    type: 'boolean',
    default: false
  },
  approved: {
    type: 'boolean',
    default: false
  },
  quiz_results: 'string',
  created_at: {
    type: 'localdatetime',
    default: () => new Date,
  },
  locked: {
    type: 'boolean',
    default: false
  },
  payout_provider: 'string',
  admin: {
    type: 'boolean',
    default: false
  },
  earns_off: {
    type: 'relationships',
    relationship: 'EARNS_OFF',
    direction: 'out',
    target: 'Tripler',
    properties: {
      since: {
        type: 'localdatetime',
        default: () => new Date,
      },
      disbursed_at: 'localdatetime',
      settled_at: 'localdatetime',
      amount: 'integer',
      status: 'string',
      disbursement_id: 'string',
      settlement_id: 'string',
      error: 'string'
    },
    eager: true
  },
  owns_account: {
    type: 'relationships',
    relationship: 'OWNS_ACCOUNT',
    direction: 'out',
    target: 'Account',
    properties: {
      since: {
        type: 'localdatetime',
        default: () => new Date,
      }
    },
    eager: true
  }
};
