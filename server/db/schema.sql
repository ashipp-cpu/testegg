CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A physical place characters stand in. Also the unit tribes will later
-- claim as territory (Phase 3) — parent_territory_id is reserved now so
-- sub-locations can be added without a breaking migration.
CREATE TABLE IF NOT EXISTS territories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  parent_territory_id INTEGER REFERENCES territories(id),
  connections TEXT NOT NULL DEFAULT '[]'
);

-- One character per user for this prototype.
CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  name TEXT NOT NULL,
  appearance_text TEXT NOT NULL,
  origin_story TEXT NOT NULL,
  stat_strength INTEGER NOT NULL,
  stat_quickness INTEGER NOT NULL,
  stat_wits INTEGER NOT NULL,
  stat_charm INTEGER NOT NULL,
  stat_grit INTEGER NOT NULL,
  hp INTEGER NOT NULL,
  energy INTEGER NOT NULL,
  location_id INTEGER NOT NULL REFERENCES territories(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- sender_name is denormalized so history renders without a join and so
-- future system/NPC messages don't need a real character row.
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  scope_id INTEGER,
  sender_character_id INTEGER REFERENCES characters(id),
  sender_name TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'say',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
