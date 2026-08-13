const db = require('../db/db');

const upsertStmt = db.prepare(`
  INSERT INTO character_relationships (character_id, other_character_id, relation, updated_at)
  VALUES (?, ?, ?, datetime('now'))
  ON CONFLICT (character_id, other_character_id) DO UPDATE SET relation = excluded.relation, updated_at = excluded.updated_at
`);
const clearStmt = db.prepare(
  'DELETE FROM character_relationships WHERE character_id = ? AND other_character_id = ?'
);
const getStmt = db.prepare(
  'SELECT * FROM character_relationships WHERE character_id = ? AND other_character_id = ?'
);
const listForCharacterStmt = db.prepare(`
  SELECT character_relationships.*, characters.name AS other_character_name
  FROM character_relationships
  JOIN characters ON characters.id = character_relationships.other_character_id
  WHERE character_id = ? AND relation = ?
  ORDER BY characters.name COLLATE NOCASE
`);

module.exports = {
  setRelation: (characterId, otherId, relation) => upsertStmt.run(characterId, otherId, relation),
  clearRelation: (characterId, otherId) => clearStmt.run(characterId, otherId),
  getRelation: (characterId, otherId) => getStmt.get(characterId, otherId),
  listForCharacter: (characterId, relation) => listForCharacterStmt.all(characterId, relation),
};
