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
const getLevelStmt = db.prepare(`
  SELECT character_skills.level
  FROM character_skills
  JOIN skills ON skills.id = character_skills.skill_id
  WHERE character_skills.character_id = ? AND skills.key = ?
`);
const averageForTribeStmt = db.prepare(`
  SELECT AVG(character_skills.level) AS avg_level
  FROM character_skills
  JOIN skills ON skills.id = character_skills.skill_id
  JOIN tribe_memberships ON tribe_memberships.character_id = character_skills.character_id
  WHERE tribe_memberships.tribe_id = ? AND skills.key = ?
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
  getLevel: (characterId, skillKey) => (getLevelStmt.get(characterId, skillKey) || {}).level || 0,
  averageForTribe: (tribeId, skillKey) => averageForTribeStmt.get(tribeId, skillKey).avg_level || 0,
};
