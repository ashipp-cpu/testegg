const db = require('../db/db');

const insertStmt = db.prepare(`
  INSERT INTO chat_messages (channel, scope_id, sender_character_id, sender_name, body, type)
  VALUES (@channel, @scope_id, @sender_character_id, @sender_name, @body, @type)
`);
const getByIdStmt = db.prepare('SELECT * FROM chat_messages WHERE id = ?');
const recentForScopeStmt = db.prepare(`
  SELECT * FROM chat_messages
  WHERE channel = ? AND scope_id = ?
  ORDER BY id DESC LIMIT ?
`);

function create(data) {
  const info = insertStmt.run(data);
  return getByIdStmt.get(info.lastInsertRowid);
}

function recent(channel, scopeId, limit = 30) {
  return recentForScopeStmt.all(channel, scopeId, limit).reverse();
}

function postSystem(channel, scopeId, body) {
  return create({
    channel,
    scope_id: scopeId,
    sender_character_id: null,
    sender_name: 'System',
    body,
    type: 'system',
  });
}

module.exports = { create, recent, postSystem };
