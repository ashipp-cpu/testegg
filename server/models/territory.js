const db = require('../db/db');

const getByIdStmt = db.prepare('SELECT * FROM territories WHERE id = ?');
const getByKeyStmt = db.prepare('SELECT * FROM territories WHERE key = ?');

module.exports = {
  getById: (id) => getByIdStmt.get(id),
  getByKey: (key) => getByKeyStmt.get(key),
};
