/*
 *
 * This model corresponds to the Account neo4j nodes
 *
 */
module.exports = {
  // This is the BlockPower internal ID
  id: {
    type: 'uuid',
    primary: true
  },
  // This is either 'stripe' or 'paypal'
  account_type: {
    type: 'string',
    required: true
  },
  // This is the StripeID or PaypalID
  account_id: {
    type: 'string',
    required: true
  },
  // If Stripe, this is the last4 of the connected bank account
  account_data: {
    type: 'string',
    required: false
  },
  // When a payout account is created / matched, it becomes the primary
  //   account to pay out to. all other accounts are set to is_primary:false
  is_primary: {
    type: 'boolean',
    default: false
  }
};
