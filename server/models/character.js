const db = require('../db/db');

const getByUserIdStmt = db.prepare('SELECT * FROM characters WHERE user_id = ?');
const getByIdStmt = db.prepare('SELECT * FROM characters WHERE id = ?');
const insertStmt = db.prepare(`
  INSERT INTO characters (
    user_id, name, gender, description, background_id,
    stat_strength, stat_quickness, stat_wits, stat_charm, stat_grit,
    hp, energy, location_id
  ) VALUES (
    @user_id, @name, @gender, @description, @background_id,
    @stat_strength, @stat_quickness, @stat_wits, @stat_charm, @stat_grit,
    @hp, @energy, @location_id
  )
`);

function create(data) {
  const info = insertStmt.run(data);
  return getByIdStmt.get(info.lastInsertRowid);
}

module.exports = {
  getByUserId: (userId) => getByUserIdStmt.get(userId),
  getById: (id) => getByIdStmt.get(id),
  create,
};
