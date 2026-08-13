const db = require('../db/db');

const listStmt = db.prepare('SELECT * FROM backgrounds ORDER BY id');
const getByKeyStmt = db.prepare('SELECT * FROM backgrounds WHERE key = ?');
const getByIdStmt = db.prepare('SELECT * FROM backgrounds WHERE id = ?');

module.exports = {
  list: () => listStmt.all(),
  getByKey: (key) => getByKeyStmt.get(key),
  getById: (id) => getByIdStmt.get(id),
};
