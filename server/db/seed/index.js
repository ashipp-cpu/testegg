const db = require('../db');
const { STARTING_TERRITORY_KEY } = require('../../config');

function seed() {
  seedTerritory();
  seedSkills();
  seedBackgrounds();
  seedTribes();
  seedAchievements();
  seedMapLocations();
}

function seedTerritory() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM territories').get();
  if (n > 0) return;

  db.prepare(`
    INSERT INTO territories (key, name, description, connections, sector_label, map_x, map_y)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    STARTING_TERRITORY_KEY,
    'The Undercroft',
    "The concrete bones of a collapsed shopping centre, sunk half underground " +
      "where the sinkhole swallowed it. Emergency lighting still flickers over " +
      "cracked tile and gutted storefronts. It smells of damp cardboard and old " +
      "smoke. Whoever's left in this town ends up passing through here sooner " +
      "or later — it's the closest thing to neutral ground.",
    '[]',
    null,
    44,
    52
  );
}

function seedSkills() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM skills').get();
  if (n > 0) return;

  const insert = db.prepare('INSERT INTO skills (key, name, description) VALUES (?, ?, ?)');
  const skills = [
    ['scavenging', 'Scavenging', 'Finding usable supplies in the ruins.'],
    ['combat', 'Combat', 'Holding your own in a fight.'],
    ['diplomacy', 'Diplomacy', 'Talking your way through tension.'],
    ['crafting', 'Crafting', 'Repairing and building from scraps.'],
    ['leadership', 'Leadership', 'Getting others to follow your call.'],
    ['stealth', 'Stealth', 'Moving unseen and unheard.'],
  ];

  const insertAll = db.transaction((rows) => rows.forEach((row) => insert.run(...row)));
  insertAll(skills);
}

function seedBackgrounds() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM backgrounds').get();
  if (n > 0) return;

  const insert = db.prepare(`
    INSERT INTO backgrounds (key, name, blurb, stat_bonuses, skill_bonuses)
    VALUES (?, ?, ?, ?, ?)
  `);

  const backgrounds = [
    [
      'student', 'Student',
      'Was still in class when the world ended. Reads a room, and a repair manual, equally well.',
      { wits: 2, charm: 1, strength: -1 }, { crafting: 2, diplomacy: 1 },
    ],
    [
      'scavenger', 'Scavenger',
      'Grew up finding what other people threw away. Nothing goes to waste.',
      { quickness: 2, wits: 1, charm: -1 }, { scavenging: 2, stealth: 1 },
    ],
    [
      'brawler', 'Brawler',
      'Solved problems with fists long before the virus made it a survival skill.',
      { strength: 2, grit: 1, wits: -1 }, { combat: 2, leadership: 1 },
    ],
    [
      'caretaker', 'Caretaker',
      "Minded younger siblings and patched up scrapes. Still can't walk past someone hurting.",
      { charm: 2, grit: 1, strength: -1 }, { diplomacy: 2, crafting: 1 },
    ],
    [
      'drifter', 'Drifter',
      'Never really had a home to begin with, so the collapse changed less than people think.',
      { quickness: 2, grit: 1, charm: -1 }, { stealth: 2, scavenging: 1 },
    ],
    [
      'ringleader', 'Ringleader',
      "The kid everyone somehow ended up following, even before there was anywhere to lead them.",
      { charm: 2, wits: 1, grit: -1 }, { leadership: 2, diplomacy: 1 },
    ],
  ];

  const insertAll = db.transaction((rows) => {
    rows.forEach(([key, name, blurb, statBonuses, skillBonuses]) => {
      insert.run(key, name, blurb, JSON.stringify(statBonuses), JSON.stringify(skillBonuses));
    });
  });
  insertAll(backgrounds);
}

function seedTribes() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM tribes').get();
  if (n > 0) return;

  const insert = db.prepare('INSERT INTO tribes (key, name, ideology_text) VALUES (?, ?, ?)');
  const tribes = [
    ['mallrats', 'Mallrats', 'Holed up in the ruins of a shopping mall — more family than faction.'],
    ['demon-dogz', 'Demon Dogz', 'Loud, chaotic, and proud of the fear they put in people.'],
    ['roosters', 'Roosters', 'Strutting and status-obsessed, always keeping score.'],
    ['jackals', 'Jackals', 'Fast and opportunistic, quick to pick a fight they can win.'],
    ['mutants', 'Mutants', 'Painted faces, no rules, living for the chaos of it.'],
    ['gulls', 'Gulls', 'Coastal scavengers who trade in whatever washes up.'],
    ['locos', 'Locos', 'Wild and unpredictable, feared for how little they have to lose.'],
    ['farm-girls', 'Farm Girls', 'Self-sufficient growers who trust dirt more than people.'],
    ['amazons', 'Amazons', 'A tribe of girls only — sharp-eyed and slow to trust outsiders.'],
    ['slave-traders', 'Slave Traders', 'Buy and sell labour, loyalty, and information, for a price.'],
    ['tribe-circus', 'Tribe Circus', 'Performers and misfits who talk their way through anything.'],
    ['ecos', 'Ecos', "Believers in living light on the land and healing what's left of it."],
  ];

  const insertAll = db.transaction((rows) => rows.forEach((row) => insert.run(...row)));
  insertAll(tribes);
}

function seedAchievements() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM achievements').get();
  if (n > 0) return;

  const insert = db.prepare('INSERT INTO achievements (key, name, description) VALUES (?, ?, ?)');
  const achievements = [
    ['alpha-tester', 'Alpha Tester', 'Played during the earliest prototype phase, before things worked right.'],
    ['beta-tester', 'Beta Tester', 'Helped stress-test the game ahead of a wider release.'],
    ['bug-hunter', 'Bug Hunter', 'Reported a bug that got fixed.'],
    ['idea-spark', 'Idea Spark', 'Suggested a feature that made it into the game.'],
  ];

  const insertAll = db.transaction((rows) => rows.forEach((row) => insert.run(...row)));
  insertAll(achievements);
}

// Gated on its own key (not a table-wide count) so it still runs once
// against a database that already has Undercroft seeded from before.
function seedMapLocations() {
  const existing = db.prepare('SELECT 1 FROM territories WHERE key = ?').get('the-mall');
  if (existing) return;

  const tribeIdByKey = (key) => {
    const row = db.prepare('SELECT id FROM tribes WHERE key = ?').get(key);
    return row ? row.id : null;
  };

  const insert = db.prepare(`
    INSERT INTO territories (key, name, description, connections, controlling_tribe_id, sector_label, map_x, map_y)
    VALUES (?, ?, ?, '[]', ?, ?, ?, ?)
  `);

  const locations = [
    // Within the city
    [
      'the-mall', 'The Mall',
      'A gutted shopping centre repurposed into a fortress-home, its storefronts stripped for parts and its food court turned into a mess hall.',
      tribeIdByKey('mallrats'), 'Sector 10', 48, 45,
    ],
    [
      'horton-bailey-hotel', 'Horton Bailey Hotel',
      "Once the city's grandest hotel, its ballrooms and function rooms have changed hands more times than anyone can count.",
      null, 'Sector 9', 56, 42,
    ],
    [
      'rail-yards', 'Rail Yards',
      'Rows of rusting freight cars and dead signal towers, right where the city gives way to the wild.',
      tribeIdByKey('locos'), 'Sector 9', 36, 52,
    ],
    [
      'state-buildings', 'Various State Buildings',
      'Government offices and civic halls, their marble lobbies long since stripped bare. Nobody controls all of it.',
      null, null, 50, 36,
    ],
    [
      'casino', 'Casino',
      'Neon signs gone dark and gaming floors picked clean of anything worth carrying.',
      tribeIdByKey('demon-dogz'), 'Sector 2', 60, 30,
    ],
    [
      'docks', 'Docks',
      'Warehouses and loading cranes along the waterline — handy for anyone trading in whatever the tide brings in.',
      tribeIdByKey('gulls'), 'Sector 9/10', 66, 63,
    ],
    // Outside the city
    [
      'liberty', 'Liberty',
      "A town some distance from the city, found by outsiders looking for somewhere the collapse hadn't reached quite so hard.",
      null, null, 85, 22,
    ],
    [
      'eco-camp', 'Eco Camp',
      'A camp in the treeline, built and kept by people who never trusted the city to begin with.',
      tribeIdByKey('ecos'), null, 14, 46,
    ],
    [
      'eagle-mountain', 'Eagle Mountain',
      'High ground with an old observatory at the top, its dome cracked open to the sky. Cold, exposed, and a long climb.',
      null, null, 20, 14,
    ],
    [
      'hope-island', 'Hope Island',
      "A small island offshore, reachable only by boat, holding secrets nobody's fully worked out yet.",
      null, null, 82, 84,
    ],
    [
      'the-beach', 'The Beach',
      "Open sand and driftwood fires. Treated as neutral ground when tribes need to meet without it turning into a fight.",
      null, null, 70, 80,
    ],
    [
      'the-farm', 'The Farm',
      'Fenced fields and a working well, kept alive by people who decided growing food mattered more than defending a fortress.',
      tribeIdByKey('farm-girls'), null, 24, 76,
    ],
  ];

  const insertAll = db.transaction((rows) => rows.forEach((row) => insert.run(...row)));
  insertAll(locations);
}

module.exports = seed;
