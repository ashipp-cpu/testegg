const db = require('../db/db');

const listStmt = db.prepare('SELECT * FROM achievements ORDER BY id');
const listForCharacterStmt = db.prepare(`
  SELECT achievements.*, character_achievements.awarded_at
  FROM character_achievements
  JOIN achievements ON achievements.id = character_achievements.achievement_id
  WHERE character_id = ?
  ORDER BY character_achievements.awarded_at
`);

module.exports = {
  list: () => listStmt.all(),
  listForCharacter: (characterId) => listForCharacterStmt.all(characterId),
};
