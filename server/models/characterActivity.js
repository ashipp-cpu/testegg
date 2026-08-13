const db = require('../db/db');

const insertStmt = db.prepare('INSERT INTO character_activity (character_id, body) VALUES (?, ?)');
const listForCharacterStmt = db.prepare(`
  SELECT * FROM character_activity WHERE character_id = ? ORDER BY id DESC LIMIT ?
`);

module.exports = {
  create: (characterId, body) => insertStmt.run(characterId, body),
  listForCharacter: (characterId, limit = 15) => listForCharacterStmt.all(characterId, limit),
};
