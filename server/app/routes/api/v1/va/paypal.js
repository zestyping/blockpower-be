import { v4 as uuidv4 } from 'uuid';

import {
  _400, _204
} from '../../../../lib/utils';

/*
 *
 * createPaypalAccount(req, res)
 *
 * This function creates a new Account neo4j node and attaches it to the current Ambassador.
 *
 * NOTE: This function really belongs in /services/paypal
 *
 */
async function createPaypalAccount(req, res) {
  try {
    const account = await req.neode.create('Account', {
      id: uuidv4(),
      account_type: 'paypal',
      account_id: 'paypal-' + req.user.get('phone'),
      account_data: JSON.stringify({last4: 'PYPL'}),
      is_primary: true
    });

    req.user.get('owns_account').forEach((entry) => {
      entry.otherNode().update({is_primary: false});
    });

    await req.user.relateTo(account, 'owns_account');
    await req.user.update({payout_provider: 'paypal', email: req.body.email});
  } catch (err) {
    return _400(res, err);
  }

  return _204(res);
}

module.exports = {
  createPaypalAccount: createPaypalAccount
}
