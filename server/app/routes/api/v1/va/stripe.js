import { v4 as uuidv4 } from 'uuid';

import {
  _400, _204
} from '../../../../lib/utils';

import stripeSvc from '../../../../services/stripe';
import plaidSvc from '../../../../services/plaid';

async function createStripeAccount(req, res) {
  if (!req.body.token) return _400(res, "Invalid value to parameter 'token'.");
  if (!req.body.account_id) return _400(res, "Invalid value to parameter 'account_id'.");

  try {
    const bankAccountToken = await plaidSvc.createStripeBankToken(req.body.token, req.body.account_id);
    const stripeConnectAccount = await stripeSvc.createConnectAccount(req.user, bankAccountToken, req.publicIP);

    const account = await req.neode.create('Account', {
      id: uuidv4(),
      account_type: 'stripe',
      account_id: stripeConnectAccount.id
    });
    await req.user.relateTo(account, 'owns_account');
    await req.user.update({payout_provider: 'stripe'});
  } catch (err) {
    return _400(res, err);
  }
  
  return _204(res);
}

module.exports = {
  createStripeAccount: createStripeAccount
};
