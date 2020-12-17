import { ov_config } from './ov_config';

// This object's keys should be property names on the Ambassador, and
// the values should be numeric weights.  The weights should be
// POSITIVE if a positive value for the property means GOOD behaviour,
// NEGATIVE if a positive value for the property means BAD behaviour.
const TRUST_WEIGHTS = {
  // Bonuses
  admin_bonus: 1,

  // Penalties
  ambassador_ekata_blemish: -1,
  tripler_ekata_blemish: -1,

  // How many triplee names don't look like names?
  num_suspicious_triplee_names: -1,

  // How many triplees have the same name as the ambassador?
  num_triplee_names_matching_ambassador: -1,

  // How many triplees have the same name as their tripler?
  num_triplee_names_matching_tripler: -1,

  // If more than two triplees have a name that matches any other triplees
  // of this ambassador, how many more? (i.e. subtract 2, ignore if negative)
  num_repeated_triplee_names_beyond_two: -1,

  // How many triplers have duplicates among their triplee names?
  num_triplers_with_repeated_triplee_names: -1,
};

// This should be a negative number, below which the user will be
// locked for fraud.
const FRAUD_THRESHOLD = parseFloat(ov_config.fraud_threshold) || -8;

// Determines whether the user's actions should be blocked for fraud,
// by comparing the total trust score to the FRAUD_THRESHOLD.
export const isLocked = (user) => {
  if (!user) return false;
  return calcTrust(user) < FRAUD_THRESHOLD;
};

// Calculates the total trust score, which will be compared against
// the FRAUD_THRESHOLD.  POSITIVE means GOOD behaviour.
export const calcTrust = (user) => {
  let trust = 0;
  for (const key of Object.keys(TRUST_WEIGHTS)) {
    trust += (user.get(key) || 0) * TRUST_WEIGHTS[key];
  }
  return trust;
};

// Gets all the details on trust to send to the admin front-end for display.
export const getTrustFactors = (user) => {
  if (!user) return {
    factors: {},
    weights: {},
    trust: 0,
    fraud_threshold: FRAUD_THRESHOLD,
  };

  const factors = {};
  for (const key of Object.keys(TRUST_WEIGHTS)) {
    factors[key] = user.get(key) || 0;
  }
  return {
    factors: factors,
    weights: TRUST_WEIGHTS,
    trust: calcTrust(user),
    fraud_threshold: FRAUD_THRESHOLD,
  };
};
