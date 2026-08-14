const db = require('../db/db');

const getByIdStmt = db.prepare('SELECT * FROM territories WHERE id = ?');
const getByKeyStmt = db.prepare('SELECT * FROM territories WHERE key = ?');
const setControllingTribeStmt = db.prepare(
  'UPDATE territories SET controlling_tribe_id = ? WHERE id = ?'
);
const listMappedStmt = db.prepare(`
  SELECT territories.*, tribes.name AS controlling_tribe_name
  FROM territories
  LEFT JOIN tribes ON tribes.id = territories.controlling_tribe_id
  WHERE map_x IS NOT NULL AND map_y IS NOT NULL
  ORDER BY territories.name COLLATE NOCASE
`);

module.exports = {
  getById: (id) => getByIdStmt.get(id),
  getByKey: (key) => getByKeyStmt.get(key),
  setControllingTribe: (territoryId, tribeId) => setControllingTribeStmt.run(tribeId, territoryId),
  listMapped: () => listMappedStmt.all(),
};
