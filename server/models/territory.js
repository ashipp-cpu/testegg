const db = require('../db/db');

const getByIdStmt = db.prepare('SELECT * FROM territories WHERE id = ?');
const getByKeyStmt = db.prepare('SELECT * FROM territories WHERE key = ?');
const setControllingTribeStmt = db.prepare(
  'UPDATE territories SET controlling_tribe_id = ? WHERE id = ?'
);

module.exports = {
  getById: (id) => getByIdStmt.get(id),
  getByKey: (key) => getByKeyStmt.get(key),
  setControllingTribe: (territoryId, tribeId) => setControllingTribeStmt.run(tribeId, territoryId),
};
