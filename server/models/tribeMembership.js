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
const listByTribeStmt = db.prepare(`
  SELECT tribe_memberships.*, characters.name, backgrounds.name AS background_name
  FROM tribe_memberships
  JOIN characters ON characters.id = tribe_memberships.character_id
  JOIN backgrounds ON backgrounds.id = characters.background_id
  WHERE tribe_id = ?
  ORDER BY
    CASE office WHEN 'leader' THEN 0 WHEN 'congress' THEN 1 ELSE 2 END,
    characters.name COLLATE NOCASE
`);
const countByTribeStmt = db.prepare('SELECT COUNT(*) AS n FROM tribe_memberships WHERE tribe_id = ?');
const countByOfficeStmt = db.prepare(
  'SELECT COUNT(*) AS n FROM tribe_memberships WHERE tribe_id = ? AND office = ?'
);
const updateOfficeStmt = db.prepare('UPDATE tribe_memberships SET office = ? WHERE character_id = ?');
const getByCharacterAndTribeStmt = db.prepare(
  'SELECT * FROM tribe_memberships WHERE character_id = ? AND tribe_id = ?'
);

module.exports = {
  getByCharacterId: (characterId) => getByCharacterIdStmt.get(characterId),
  create: (characterId, tribeId) => insertStmt.run(characterId, tribeId),
  listByTribe: (tribeId) => listByTribeStmt.all(tribeId),
  countByTribe: (tribeId) => countByTribeStmt.get(tribeId).n,
  countByOffice: (tribeId, office) => countByOfficeStmt.get(tribeId, office).n,
  setOffice: (characterId, office) => updateOfficeStmt.run(office, characterId),
  getByCharacterAndTribe: (characterId, tribeId) => getByCharacterAndTribeStmt.get(characterId, tribeId),
};
