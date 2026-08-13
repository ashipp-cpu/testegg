const db = require('../db/db');

const upsertStmt = db.prepare(`
  INSERT INTO tribe_diplomacy_stances (tribe_id, other_tribe_id, stance, updated_at)
  VALUES (?, ?, ?, datetime('now'))
  ON CONFLICT (tribe_id, other_tribe_id) DO UPDATE SET stance = excluded.stance, updated_at = excluded.updated_at
`);
const listForTribeStmt = db.prepare(`
  SELECT tribe_diplomacy_stances.*, tribes.name AS other_tribe_name
  FROM tribe_diplomacy_stances
  JOIN tribes ON tribes.id = tribe_diplomacy_stances.other_tribe_id
  WHERE tribe_id = ?
  ORDER BY tribes.name
`);
const clearStanceStmt = db.prepare(
  'DELETE FROM tribe_diplomacy_stances WHERE tribe_id = ? AND other_tribe_id = ?'
);

module.exports = {
  setStance: (tribeId, otherTribeId, stance) => upsertStmt.run(tribeId, otherTribeId, stance),
  clearStance: (tribeId, otherTribeId) => clearStanceStmt.run(tribeId, otherTribeId),
  listForTribe: (tribeId) => listForTribeStmt.all(tribeId),
};
