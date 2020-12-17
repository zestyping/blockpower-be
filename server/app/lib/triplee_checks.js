import { normalizeName, isNameValid } from './name_checks';
import { parseJson } from './json';

function evaluateTripleeNames(ambassadorName, triplerName, tripleeNames) {
  const nonUniqueNames = [];
  const suspiciousNames = [];
  const sameAsAmbassadorNames = [];
  const sameAsTriplerNames = [];

  const normAmbassadorName = normalizeName(ambassadorName);
  const normTriplerName = normalizeName(triplerName);

  const seenNames = new Set();
  for (const name of tripleeNames) {
    const norm = normalizeName(name);

    if (seenNames.has(norm)) nonUniqueNames.push(name);
    if (!isNameValid(norm)) suspiciousNames.push(name);
    if (norm === normAmbassadorName) sameAsAmbassadorNames.push(name);
    if (norm === normTriplerName) sameAsTriplerNames.push(name);

    seenNames.add(norm);
  }
  return {
    nonUniqueNames,
    suspiciousNames,
    sameAsAmbassadorNames,
    sameAsTriplerNames
  };
}

function getFullName(node) {
  return (node.get('first_name') + ' ' + node.get('last_name')).trim();
}

function calcTripleeNameTrustFactors(ambassador, triplers) {
  const allTripleeNames = [];
  let numSuspiciousNames = 0;
  let numSameAsAmbassadorNames = 0;
  let numSameAsTriplerNames = 0;
  let numTriplersWithRepeatedTriplees = 0;

  for (const tripler of triplers) {
    const tripleeNames = parseJson(tripler.get('triplees'), []);
    allTripleeNames.push(...tripleeNames.map(normalizeName));

    const result = evaluateTripleeNames(
      getFullName(ambassador), getFullName(tripler), tripleeNames);
    numSuspiciousNames += result.suspiciousNames.length;
    numSameAsAmbassadorNames += result.sameAsAmbassadorNames.length;
    numSameAsTriplerNames += result.sameAsTriplerNames.length;
    if (result.nonUniqueNames.length > 0) {
      numTriplersWithRepeatedTriplees += 1;
    }
  }
  const numUniqueTriplees = new Set(allTripleeNames).size;
  const numRepeatedNames = allTripleeNames.length - numUniqueTriplees;
  return {
    num_suspicious_triplee_names: numSuspiciousNames,
    num_triplee_names_matching_ambassador: numSameAsAmbassadorNames,
    num_triplee_names_matching_tripler: numSameAsTriplerNames,
    num_repeated_triplee_names_beyond_two: Math.max(0, numRepeatedNames - 2),
    num_triplers_with_repeated_triplee_names: numTriplersWithRepeatedTriplees,
  }
}

module.exports = {
  evaluateTripleeNames,
  calcTripleeNameTrustFactors
};
