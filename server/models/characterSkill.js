const db = require('../db/db');

const insertStmt = db.prepare(
  'INSERT INTO character_skills (character_id, skill_id, level) VALUES (?, ?, ?)'
);
const listForCharacterStmt = db.prepare(`
  SELECT skills.key, skills.name, character_skills.level
  FROM character_skills
  JOIN skills ON skills.id = character_skills.skill_id
  WHERE character_skills.character_id = ?
  ORDER BY skills.id
`);

function createMany(characterId, skillLevels) {
  const insertAll = db.transaction((rows) => {
    rows.forEach((row) => insertStmt.run(characterId, row.skill_id, row.level));
  });
  insertAll(skillLevels);
}

module.exports = {
  createMany,
  listForCharacter: (characterId) => listForCharacterStmt.all(characterId),
};
