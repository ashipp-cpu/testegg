const db = require('../db/db');

const listStmt = db.prepare('SELECT * FROM tribes ORDER BY name');
const getByKeyStmt = db.prepare('SELECT * FROM tribes WHERE key = ?');
const getByIdStmt = db.prepare('SELECT * FROM tribes WHERE id = ?');

module.exports = {
  list: () => listStmt.all(),
  getByKey: (key) => getByKeyStmt.get(key),
  getById: (id) => getByIdStmt.get(id),
};
