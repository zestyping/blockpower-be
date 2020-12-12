import { ov_config } from './ov_config';

// This should be a negative number.
const FRAUD_THRESHOLD = parseFloat(ov_config.fraud_threshold) || -8;

// Determines whether the user's actions should be blocked for fraud,
// by summing all components of the fraud score.
export const isLocked = (user) => {
  return user.locked;

  // TODO: The above is a placeholder.  Ultimately this should look like:
  const adminBonus = user.adminBonus || 0;
  const niceTieBonus = 0;
  const badHairPenalty = 0;
  const emacsUserPenalty = 0; // just kidding!

  const score = adminBonus + niceTieBonus - badHairPenalty - emacsUserPenalty;
  return score < FRAUD_THRESHOLD;
};
