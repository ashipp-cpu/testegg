const tribeElections = require('../models/tribeElection');
const tribeMemberships = require('../models/tribeMembership');
const tribeNews = require('./tribeNews');

const CONGRESS_SEATS = 3;
const CONGRESS_VOTES_PER_MEMBER = 3;

function majorityThreshold(memberCount) {
  return Math.floor(memberCount / 2) + 1;
}

function tally(votes) {
  const counts = new Map();
  votes.forEach((vote) => {
    counts.set(vote.candidate_character_id, (counts.get(vote.candidate_character_id) || 0) + 1);
  });
  return counts;
}

// Opens (or reuses) an election for a vacant seat and registers a
// self-nomination. Throws a descriptive error the route can surface.
function nominate(tribeId, office, characterId) {
  const membership = tribeMemberships.getByCharacterAndTribe(characterId, tribeId);
  if (!membership || membership.office !== 'member') {
    throw new Error('Only members without an office can run for one.');
  }

  const vacantSeats =
    office === 'leader'
      ? 1 - tribeMemberships.countByOffice(tribeId, 'leader')
      : CONGRESS_SEATS - tribeMemberships.countByOffice(tribeId, 'congress');
  if (vacantSeats <= 0) {
    throw new Error('There is no vacant seat for that office right now.');
  }

  let election = tribeElections.getOpenElection(tribeId, office);
  if (!election) {
    election = tribeElections.openElection(tribeId, office, vacantSeats);
  }

  tribeElections.nominate(election.id, characterId);
  return tribeElections.getById(election.id);
}

function castVote(electionId, voterCharacterId, candidateCharacterId) {
  const election = tribeElections.getById(electionId);
  if (!election || election.status !== 'open' || election.target_character_id) {
    throw new Error('That election is not open for voting.');
  }

  const candidates = tribeElections.listCandidates(electionId).map((c) => c.character_id);
  if (!candidates.includes(candidateCharacterId)) {
    throw new Error('That candidate is not running in this election.');
  }

  if (election.office === 'leader') {
    // A leader vote is a single ballot — replace any existing one.
    tribeElections.listVotes(electionId)
      .filter((vote) => vote.voter_character_id === voterCharacterId)
      .forEach((vote) => tribeElections.retractVote(electionId, voterCharacterId, vote.candidate_character_id));
  } else {
    const alreadyCast = tribeElections.countBallotsCastBy(electionId, voterCharacterId);
    const alreadyVotedThisCandidate = tribeElections
      .listVotes(electionId)
      .some((vote) => vote.voter_character_id === voterCharacterId && vote.candidate_character_id === candidateCharacterId);
    if (!alreadyVotedThisCandidate && alreadyCast >= CONGRESS_VOTES_PER_MEMBER) {
      throw new Error(`You can only back up to ${CONGRESS_VOTES_PER_MEMBER} Congress candidates.`);
    }
  }

  tribeElections.castVote(electionId, voterCharacterId, candidateCharacterId);
  return resolveIfReady(election);
}

function retractVote(electionId, voterCharacterId, candidateCharacterId) {
  tribeElections.retractVote(electionId, voterCharacterId, candidateCharacterId);
}

function resolveIfReady(election) {
  const memberCount = tribeMemberships.countByTribe(election.tribe_id);
  const votes = tribeElections.listVotes(election.id);
  const counts = tally(votes);

  if (election.office === 'leader') {
    const threshold = majorityThreshold(memberCount);
    const winnerId = [...counts.entries()].find(([, count]) => count >= threshold)?.[0];
    if (!winnerId) return { resolved: false };

    tribeMemberships.setOffice(winnerId, 'leader');
    tribeElections.close(election.id);
    const winnerName = tribeElections.listCandidates(election.id).find((c) => c.character_id === winnerId)?.name;
    tribeNews.announce(election.tribe_id, `${winnerName} was elected Leader.`);
    return { resolved: true, office: 'leader', winners: [winnerId] };
  }

  // Congress: needs quorum of distinct voters, then seats the top vote-getters.
  const quorum = majorityThreshold(memberCount);
  const distinctVoters = tribeElections.countDistinctVoters(election.id);
  if (distinctVoters < quorum) return { resolved: false };

  const candidates = tribeElections.listCandidates(election.id);
  const ranked = candidates
    .map((c) => ({ ...c, votes: counts.get(c.character_id) || 0 }))
    .sort((a, b) => b.votes - a.votes);
  const winners = ranked.slice(0, election.seat_count);

  winners.forEach((winner) => tribeMemberships.setOffice(winner.character_id, 'congress'));
  tribeElections.close(election.id);
  if (winners.length > 0) {
    const names = winners.map((w) => w.name).join(', ');
    tribeNews.announce(election.tribe_id, `${names} joined the Congress.`);
  }
  return { resolved: true, office: 'congress', winners: winners.map((w) => w.character_id) };
}

function startRecall(tribeId, targetCharacterId, initiatorCharacterId) {
  const target = tribeMemberships.getByCharacterAndTribe(targetCharacterId, tribeId);
  if (!target || (target.office !== 'leader' && target.office !== 'congress')) {
    throw new Error('That member does not hold an office to recall them from.');
  }
  if (tribeElections.getOpenRecall(tribeId, targetCharacterId)) {
    throw new Error('A recall vote against that member is already open.');
  }

  const election = tribeElections.openRecall(tribeId, targetCharacterId, target.office);
  return castRecallVote(election.id, initiatorCharacterId);
}

function castRecallVote(electionId, voterCharacterId) {
  const election = tribeElections.getById(electionId);
  if (!election || election.status !== 'open' || !election.target_character_id) {
    throw new Error('That recall vote is not open.');
  }

  tribeElections.castVote(electionId, voterCharacterId, election.target_character_id);
  return resolveRecallIfReady(election);
}

function retractRecallVote(electionId, voterCharacterId) {
  const election = tribeElections.getById(electionId);
  if (!election) return;
  tribeElections.retractVote(electionId, voterCharacterId, election.target_character_id);
}

function resolveRecallIfReady(election) {
  const memberCount = tribeMemberships.countByTribe(election.tribe_id);
  const threshold = majorityThreshold(memberCount);
  const support = tribeElections.listVotes(election.id).length;
  if (support < threshold) return { resolved: false };

  tribeMemberships.setOffice(election.target_character_id, 'member');
  tribeElections.close(election.id);
  tribeNews.announce(election.tribe_id, `A recall vote removed a member from the ${election.office} office.`);
  return { resolved: true };
}

module.exports = {
  CONGRESS_SEATS,
  CONGRESS_VOTES_PER_MEMBER,
  nominate,
  castVote,
  retractVote,
  startRecall,
  castRecallVote,
  retractRecallVote,
};
