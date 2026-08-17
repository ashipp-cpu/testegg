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
    INSERT INTO territories (
      key, name, description, connections, sector_number, tier,
      grid_row, grid_col, grid_row_span, grid_col_span
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    STARTING_TERRITORY_KEY,
    'The Undercroft',
    "The concrete bones of a collapsed shopping centre, sunk half underground " +
      "where the sinkhole swallowed it. Emergency lighting still flickers over " +
      "cracked tile and gutted storefronts. It smells of damp cardboard and old " +
      "smoke. Whoever's left in this town ends up passing through here sooner " +
      "or later — it's the closest thing to neutral ground.",
    '[]',
    9,
    'major',
    12, 20, 2, 2
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
// sector_number places a location in the Map tab's 4x4 city grid (1-16);
// null means it's shown under "Outside the City" instead.
function seedMapLocations() {
  const existing = db.prepare('SELECT 1 FROM territories WHERE key = ?').get('the-mall');
  if (existing) return;

  const tribeIdByKey = (key) => {
    const row = db.prepare('SELECT id FROM tribes WHERE key = ?').get(key);
    return row ? row.id : null;
  };

  const insert = db.prepare(`
    INSERT INTO territories (
      key, name, description, connections, controlling_tribe_id, sector_number, tier,
      grid_row, grid_col, grid_row_span, grid_col_span
    )
    VALUES (?, ?, ?, '[]', ?, ?, ?, ?, ?, ?, ?)
  `);

  // Within the city, drawn on the 25x25 grid — footprint sized to the
  // location, positioned within its sector's bounds (server/game/cityGrid.js).
  const majorsOnGrid = [
    [
      'the-mall', 'The Mall',
      'A gutted shopping centre repurposed into a fortress-home, its storefronts stripped for parts and its food court turned into a mess hall.',
      tribeIdByKey('mallrats'), 10, 8, 8, 3, 6,
    ],
    [
      'horton-bailey-hotel', 'Horton Bailey Hotel',
      "Once the city's grandest hotel, its ballrooms and function rooms have changed hands more times than anyone can count.",
      null, 9, 7, 20, 3, 3,
    ],
    [
      'rail-yards', 'Rail Yards',
      'Rows of rusting freight cars and dead signal towers, right where the city gives way to the wild.',
      tribeIdByKey('locos'), 9, 10, 20, 2, 5,
    ],
    [
      'state-buildings', 'Various State Buildings',
      'Government offices and civic halls, their marble lobbies long since stripped bare. Nobody controls all of it.',
      null, 5, 2, 2, 4, 4,
    ],
    [
      'casino', 'Casino',
      'Neon signs gone dark and gaming floors picked clean of anything worth carrying.',
      tribeIdByKey('demon-dogz'), 2, 2, 15, 3, 3,
    ],
    [
      'docks', 'Docks',
      'Warehouses and loading cranes along the waterline — handy for anyone trading in whatever the tide brings in.',
      tribeIdByKey('gulls'), 10, 12, 8, 2, 5,
    ],
  ];

  // Outside the city — not drawn on the grid, shown in their own section.
  const majorsOutside = [
    [
      'liberty', 'Liberty',
      "A town some distance from the city, found by outsiders looking for somewhere the collapse hadn't reached quite so hard.",
      null, null,
    ],
    [
      'eco-camp', 'Eco Camp',
      'A camp in the treeline, built and kept by people who never trusted the city to begin with.',
      tribeIdByKey('ecos'), null,
    ],
    [
      'eagle-mountain', 'Eagle Mountain',
      'High ground with an old observatory at the top, its dome cracked open to the sky. Cold, exposed, and a long climb.',
      null, null,
    ],
    [
      'hope-island', 'Hope Island',
      "A small island offshore, reachable only by boat, holding secrets nobody's fully worked out yet.",
      null, null,
    ],
    [
      'the-beach', 'The Beach',
      "Open sand and driftwood fires. Treated as neutral ground when tribes need to meet without it turning into a fight.",
      null, null,
    ],
    [
      'the-farm', 'The Farm',
      'Fenced fields and a working well, kept alive by people who decided growing food mattered more than defending a fortress.',
      tribeIdByKey('farm-girls'), null,
    ],
  ];

  // Generic minor locations, unclaimed at the start — most of the map's
  // actual territory-claiming targets once that reaches beyond
  // The Undercroft. Spread across the sectors that don't already have
  // two majors, plus a handful outside the city.
  const minors = [
    ['old-police-station', 'Old Police Station', 'Cells still locked, evidence room long since picked through.', 1],
    ['corner-store', 'Corner Store', "Boarded windows, but the door's been kicked in more than once.", 2],
    ['public-library', 'Public Library', 'Nobody reads anymore, but the reference section still has good maps.', 3],
    ['riverside-apartments', 'Riverside Apartments', 'Dozens of units, most stripped bare, a few still locked tight.', 3],
    ['hardware-store', 'Hardware Store', 'Picked over early, but the stockroom out back still surprises people.', 4],
    ['bus-depot', 'Bus Depot', 'Rows of dead buses, good for parts or sleeping rough.', 4],
    ['fire-station', 'Fire Station', 'Trucks are long gone, but the tools cabinet is worth checking.', 5],
    ['old-cinema', 'Old Cinema', 'Marquee letters have fallen off one by one. Screens are torn through.', 6],
    ['laundromat', 'Laundromat', "Machines rusted shut, but it's dry and mostly out of sight.", 6],
    ['warehouse-district', 'Warehouse District', 'Rows of shuttered loading bays. Easy to get lost in, easier to get trapped.', 7],
    ['high-school', 'High School', "Lockers still have names on them. Nobody's touched the gym in years.", 7],
    ['old-supermarket', 'Old Supermarket', 'Shelves went bare fast, but people still check the storeroom out of habit.', 8],
    ['old-gym', 'Old Gym', "Weights rusted in place. Someone's been keeping the mats clean, though.", 8],
    ['old-diner', 'Old Diner', 'Booths are falling apart, but the kitchen still has usable knives.', 11],
    ['playground', 'Playground', "Rusted swings creak in the wind. Nobody's kept it up.", 11],
    ['community-pool', 'Community Pool', 'Drained and cracked, used more as a lookout point these days.', 12],
    ['freeway-overpass', 'Freeway Overpass', 'High ground and good sightlines, but exposed to the weather.', 12],
    ['old-radio-station', 'Old Radio Station', "The antenna's still standing. Nobody's gotten the equipment working again.", 13],
    ['construction-site', 'Abandoned Construction Site', 'A half-built tower, scaffolding still up. Dangerous, but tall.', 13],
    ['electronics-store', 'Electronics Store', 'Picked clean of anything with a battery a long time ago.', 14],
    ['university-campus', 'University Campus', 'Lecture halls and dorms, sprawling and easy to get turned around in.', 14],
    ['old-hospital', 'Old Hospital', 'Wards long emptied, but the dispensary still gets checked from time to time.', 15],
    ['sports-stadium', 'Sports Stadium', 'Huge and echoing. Used for gatherings when the tribes can stand to share it.', 15],
    ['old-church', 'Old Church', "Pews mostly intact. Some people still won't go inside.", 16],
    ['cemetery', 'Cemetery', 'Quiet, overgrown, and mostly left alone.', 16],
    // Outside the city
    ['roadside-motel', 'Roadside Motel', 'Rooms mostly gutted, but the sign still lights up some nights nobody can explain.', null],
    ['grain-silo', 'Grain Silo', 'Empty now, but it still stands tall over the fields.', null],
    ['truck-stop-diner', 'Truck Stop Diner', 'Picked-over vending machines and a boarded-up counter.', null],
    ['old-quarry', 'Old Quarry', 'A deep cut in the rock, good for hiding, bad for getting out of in a hurry.', null],
    ['ranger-station', 'Forest Ranger Station', 'A lookout tower and a locked supply shed, half-swallowed by the treeline.', null],
  ];

  const insertAll = db.transaction((rows) => rows.forEach((row) => insert.run(...row)));

  insertAll(majorsOnGrid.map(([key, name, description, tribeId, sectorNumber, row, col, rowSpan, colSpan]) =>
    [key, name, description, tribeId, sectorNumber, 'major', row, col, rowSpan, colSpan]));

  insertAll(majorsOutside.map(([key, name, description, tribeId, sectorNumber]) =>
    [key, name, description, tribeId, sectorNumber, 'major', null, null, null, null]));

  insertAll(minors.map(([key, name, description, sectorNumber]) =>
    [key, name, description, null, sectorNumber, 'minor', null, null, null, null]));
}

module.exports = seed;
