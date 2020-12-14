import {v4 as uuidv4} from "uuid"
import neode from '../lib/neode';
import { selectTemplate, fillTemplate, getTemplateUsageCount } from '../lib/link_code';

const createVotingPlan = async (canvasser, voter) => {
  const template = await selectTemplate(
    voter.get('first_name'), voter.get('last_name'));
  const linkCode = await reserveLinkCode(template);
  const plan = getVotingPlan(linkCode);
  plan.relateTo(canvasser, 'canvasser');
  plan.relateTo(voter, 'voter');
  return plan;
};

const reserveLinkCode = async (template) => {
  // Select numDigits so that at most 1% of the possibilities will be used up.
  const usageCount = await getTemplateUsageCount(template);
  const numDigits = usageCount < 100 ? 2 : usageCount < 10000 ? 3 : 4;

  // Since there's only a 1% chance of a collision on each attempt,
  // it's extremely unlikely that we'll fail 20 times in a row.
  for (let numAttempts = 0; numAttempts < 20; numAttempts++) {
    const linkCode = fillTemplate(template, numDigits);
    const result = await neode.cypher(`
      MERGE (p: VotingPlan {link_code: $link_code})
      ON CREATE SET
        p.id = $uuid,
        p.new = true,
        p.create_time = timestamp()
      ON MATCH SET p.new = false
      RETURN p.new as new
    `, {link_code: linkCode, uuid: uuidv4()});
    if (result.records[0].get('new') === true) {
      return linkCode;
    }
  }
};

const getVotingPlan = async (linkCode) =>
  await node.first('VotingPlan', 'link_code', linkCode);

module.exports = {
  createVotingPlan,
  getVotingPlan
};
