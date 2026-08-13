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

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL
);

-- A background is a starting archetype (Student, Scavenger, Brawler...).
-- Bonuses are stored as JSON deltas rather than fixed columns so new
-- backgrounds or bonus types don't require a schema change.
CREATE TABLE IF NOT EXISTS backgrounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  blurb TEXT NOT NULL,
  stat_bonuses TEXT NOT NULL DEFAULT '{}',
  skill_bonuses TEXT NOT NULL DEFAULT '{}'
);

-- One character per user for this prototype. Stats and starting skill
-- levels are derived from the chosen background, not hand-allocated.
CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  name TEXT NOT NULL,
  appearance_text TEXT NOT NULL,
  origin_story TEXT NOT NULL,
  background_id INTEGER NOT NULL REFERENCES backgrounds(id),
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

CREATE TABLE IF NOT EXISTS character_skills (
  character_id INTEGER NOT NULL REFERENCES characters(id),
  skill_id INTEGER NOT NULL REFERENCES skills(id),
  level INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (character_id, skill_id)
);

-- The fixed roster of joinable tribes — characters join one, they can't
-- found their own.
CREATE TABLE IF NOT EXISTS tribes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  ideology_text TEXT NOT NULL
);

-- Join table (not columns on characters) so membership history and
-- future non-exclusive relationships stay possible. UNIQUE on
-- character_id enforces one tribe at a time for now.
CREATE TABLE IF NOT EXISTS tribe_memberships (
  character_id INTEGER NOT NULL UNIQUE REFERENCES characters(id),
  tribe_id INTEGER NOT NULL REFERENCES tribes(id),
  office TEXT NOT NULL DEFAULT 'member',
  joined_at TEXT NOT NULL DEFAULT (datetime('now'))
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
