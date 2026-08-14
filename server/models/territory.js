const db = require('../db/db');

const getByIdStmt = db.prepare('SELECT * FROM territories WHERE id = ?');
const getByKeyStmt = db.prepare('SELECT * FROM territories WHERE key = ?');
const setControllingTribeStmt = db.prepare(
  'UPDATE territories SET controlling_tribe_id = ? WHERE id = ?'
);
const listAllStmt = db.prepare(`
  SELECT territories.*, tribes.name AS controlling_tribe_name
  FROM territories
  LEFT JOIN tribes ON tribes.id = territories.controlling_tribe_id
  ORDER BY (sector_number IS NULL), sector_number, tier, territories.name COLLATE NOCASE
`);

module.exports = {
  getById: (id) => getByIdStmt.get(id),
  getByKey: (key) => getByKeyStmt.get(key),
  setControllingTribe: (territoryId, tribeId) => setControllingTribeStmt.run(tribeId, territoryId),
  listAll: () => listAllStmt.all(),
};
