const db = require('../db/db');

const getByCharacterIdStmt = db.prepare(`
  SELECT tribe_memberships.*, tribes.name AS tribe_name, tribes.key AS tribe_key
  FROM tribe_memberships
  JOIN tribes ON tribes.id = tribe_memberships.tribe_id
  WHERE character_id = ?
`);
const insertStmt = db.prepare(
  'INSERT INTO tribe_memberships (character_id, tribe_id) VALUES (?, ?)'
);

module.exports = {
  getByCharacterId: (characterId) => getByCharacterIdStmt.get(characterId),
  create: (characterId, tribeId) => insertStmt.run(characterId, tribeId),
};
