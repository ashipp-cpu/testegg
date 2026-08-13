const db = require('../db/db');

const listStmt = db.prepare('SELECT * FROM skills ORDER BY id');

module.exports = {
  list: () => listStmt.all(),
};
