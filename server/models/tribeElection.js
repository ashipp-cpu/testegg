const db = require('../db/db');

const insertElectionStmt = db.prepare(`
  INSERT INTO tribe_elections (tribe_id, office, seat_count, target_character_id)
  VALUES (?, ?, ?, ?)
`);
const getElectionByIdStmt = db.prepare('SELECT * FROM tribe_elections WHERE id = ?');
const getOpenElectionStmt = db.prepare(`
  SELECT * FROM tribe_elections
  WHERE tribe_id = ? AND office = ? AND status = 'open' AND target_character_id IS NULL
`);
const getOpenRecallStmt = db.prepare(`
  SELECT * FROM tribe_elections
  WHERE tribe_id = ? AND target_character_id = ? AND status = 'open'
`);
const closeElectionStmt = db.prepare(`
  UPDATE tribe_elections SET status = 'closed', closed_at = datetime('now') WHERE id = ?
`);

const insertCandidateStmt = db.prepare(`
  INSERT OR IGNORE INTO tribe_election_candidates (election_id, character_id) VALUES (?, ?)
`);
const listCandidatesStmt = db.prepare(`
  SELECT tribe_election_candidates.character_id, tribe_election_candidates.declared_at, characters.name
  FROM tribe_election_candidates
  JOIN characters ON characters.id = tribe_election_candidates.character_id
  WHERE election_id = ?
  ORDER BY tribe_election_candidates.declared_at, tribe_election_candidates.character_id
`);

const insertVoteStmt = db.prepare(`
  INSERT OR IGNORE INTO tribe_votes (election_id, voter_character_id, candidate_character_id)
  VALUES (?, ?, ?)
`);
const deleteVoteStmt = db.prepare(`
  DELETE FROM tribe_votes WHERE election_id = ? AND voter_character_id = ? AND candidate_character_id = ?
`);
const listVotesStmt = db.prepare('SELECT * FROM tribe_votes WHERE election_id = ?');
const countVoterBallotsStmt = db.prepare(`
  SELECT COUNT(*) AS n FROM tribe_votes WHERE election_id = ? AND voter_character_id = ?
`);
const countDistinctVotersStmt = db.prepare(`
  SELECT COUNT(DISTINCT voter_character_id) AS n FROM tribe_votes WHERE election_id = ?
`);

module.exports = {
  openElection: (tribeId, office, seatCount) =>
    getElectionByIdStmt.get(insertElectionStmt.run(tribeId, office, seatCount, null).lastInsertRowid),
  openRecall: (tribeId, targetCharacterId, office) =>
    getElectionByIdStmt.get(insertElectionStmt.run(tribeId, office, 1, targetCharacterId).lastInsertRowid),
  getById: (id) => getElectionByIdStmt.get(id),
  getOpenElection: (tribeId, office) => getOpenElectionStmt.get(tribeId, office),
  getOpenRecall: (tribeId, targetCharacterId) => getOpenRecallStmt.get(tribeId, targetCharacterId),
  close: (id) => closeElectionStmt.run(id),

  nominate: (electionId, characterId) => insertCandidateStmt.run(electionId, characterId),
  listCandidates: (electionId) => listCandidatesStmt.all(electionId),

  castVote: (electionId, voterId, candidateId) => insertVoteStmt.run(electionId, voterId, candidateId),
  retractVote: (electionId, voterId, candidateId) => deleteVoteStmt.run(electionId, voterId, candidateId),
  listVotes: (electionId) => listVotesStmt.all(electionId),
  countBallotsCastBy: (electionId, voterId) => countVoterBallotsStmt.get(electionId, voterId).n,
  countDistinctVoters: (electionId) => countDistinctVotersStmt.get(electionId).n,
};
