const db = require('../db/db');

const findByUsernameStmt = db.prepare('SELECT * FROM users WHERE username = ?');
const findByIdStmt = db.prepare('SELECT * FROM users WHERE id = ?');
const insertStmt = db.prepare('INSERT INTO users (username) VALUES (?)');
const updateLastLoginStmt = db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?");

function findOrCreateByUsername(username) {
  const existing = findByUsernameStmt.get(username);
  if (existing) return existing;
  const info = insertStmt.run(username);
  return findByIdStmt.get(info.lastInsertRowid);
}

module.exports = {
  findOrCreateByUsername,
  findById: (id) => findByIdStmt.get(id),
  updateLastLogin: (id) => updateLastLoginStmt.run(id),
};
