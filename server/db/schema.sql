CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

-- A physical place characters stand in, and the unit tribes claim as
-- territory. parent_territory_id is reserved so sub-locations can be
-- added without a breaking migration. controlling_tribe_id is null
-- while unclaimed.
CREATE TABLE IF NOT EXISTS territories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  parent_territory_id INTEGER REFERENCES territories(id),
  connections TEXT NOT NULL DEFAULT '[]',
  controlling_tribe_id INTEGER REFERENCES tribes(id)
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
  ideology_text TEXT NOT NULL,
  policy_text TEXT NOT NULL DEFAULT ''
);

-- Join table (not columns on characters) so membership history and
-- future non-exclusive relationships stay possible. UNIQUE on
-- character_id enforces one tribe at a time for now. office is a fixed
-- enum ('member'|'congress'|'leader') rather than a configurable
-- per-tribe rank table, since offices are standardised across all
-- tribes now that founding (and custom ranks) is gone — see
-- server/game/permissions.js for what each office can do.
CREATE TABLE IF NOT EXISTS tribe_memberships (
  character_id INTEGER NOT NULL UNIQUE REFERENCES characters(id),
  tribe_id INTEGER NOT NULL REFERENCES tribes(id),
  office TEXT NOT NULL DEFAULT 'member',
  joined_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- An election fills a vacant Leader/Congress seat, or (when
-- target_character_id is set) is a recall vote against a sitting
-- officer. Resolved synchronously as votes come in — see
-- server/game/elections.js — so no scheduler/cron is needed.
CREATE TABLE IF NOT EXISTS tribe_elections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tribe_id INTEGER NOT NULL REFERENCES tribes(id),
  office TEXT NOT NULL, -- 'leader' | 'congress'
  seat_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'closed'
  target_character_id INTEGER REFERENCES characters(id),
  opened_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS tribe_election_candidates (
  election_id INTEGER NOT NULL REFERENCES tribe_elections(id),
  character_id INTEGER NOT NULL REFERENCES characters(id),
  declared_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (election_id, character_id)
);

-- For a recall election, candidate_character_id is always the target —
-- a row here is a "yes" vote to recall them. Deleting a row retracts it.
CREATE TABLE IF NOT EXISTS tribe_votes (
  election_id INTEGER NOT NULL REFERENCES tribe_elections(id),
  voter_character_id INTEGER NOT NULL REFERENCES characters(id),
  candidate_character_id INTEGER NOT NULL REFERENCES characters(id),
  cast_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (election_id, voter_character_id, candidate_character_id)
);

-- One-directional stance this tribe holds toward another (not a mutual
-- treaty — full bilateral diplomacy negotiation is a later phase).
CREATE TABLE IF NOT EXISTS tribe_diplomacy_stances (
  tribe_id INTEGER NOT NULL REFERENCES tribes(id),
  other_tribe_id INTEGER NOT NULL REFERENCES tribes(id),
  stance TEXT NOT NULL, -- 'ally' | 'rival' | 'war'
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (tribe_id, other_tribe_id)
);

CREATE TABLE IF NOT EXISTS tribe_announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tribe_id INTEGER NOT NULL REFERENCES tribes(id),
  author_character_id INTEGER NOT NULL REFERENCES characters(id),
  body TEXT NOT NULL,
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

-- A personal "recent actions" log, populated alongside the tribe news
-- feed at the same call sites (see server/game/activity.js) but phrased
-- for the acting character's own profile rather than a tribe-wide feed.
CREATE TABLE IF NOT EXISTS character_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id INTEGER NOT NULL REFERENCES characters(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One-directional character-to-character relationship (mirrors
-- tribe_diplomacy_stances) — not a mutual/confirmed friendship, just
-- this character's own public read on another.
CREATE TABLE IF NOT EXISTS character_relationships (
  character_id INTEGER NOT NULL REFERENCES characters(id),
  other_character_id INTEGER NOT NULL REFERENCES characters(id),
  relation TEXT NOT NULL, -- 'friend' | 'enemy'
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (character_id, other_character_id)
);

-- Catalog of meta/community badges (Alpha Tester, Bug Hunter...), not
-- earned through gameplay — granted via server/scripts/grantAchievement.js
-- until there's an admin role/UI to do it from the browser.
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS character_achievements (
  character_id INTEGER NOT NULL REFERENCES characters(id),
  achievement_id INTEGER NOT NULL REFERENCES achievements(id),
  awarded_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (character_id, achievement_id)
);
