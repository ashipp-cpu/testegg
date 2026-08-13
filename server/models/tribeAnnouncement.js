const db = require('../db/db');

const insertStmt = db.prepare(`
  INSERT INTO tribe_announcements (tribe_id, author_character_id, body) VALUES (?, ?, ?)
`);
const listForTribeStmt = db.prepare(`
  SELECT tribe_announcements.*, characters.name AS author_name
  FROM tribe_announcements
  JOIN characters ON characters.id = tribe_announcements.author_character_id
  WHERE tribe_id = ?
  ORDER BY id DESC
  LIMIT ?
`);

module.exports = {
  create: (tribeId, authorCharacterId, body) => insertStmt.run(tribeId, authorCharacterId, body),
  listForTribe: (tribeId, limit = 10) => listForTribeStmt.all(tribeId, limit),
};
