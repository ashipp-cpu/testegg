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
    ['farming', 'Farming', 'Keeping food growing when nothing else is easy.'],
  ];

  const insertAll = db.transaction((rows) => rows.forEach((row) => insert.run(...row)));
  insertAll(skills);
}

function seedBackgrounds() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM backgrounds').get();
  if (n > 0) return;

  const insert = db.prepare(`
    INSERT INTO backgrounds (key, name, blurb, icon, color, buff_label, stat_bonuses, skill_bonuses)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const backgrounds = [
    [
      'student', 'Student', '🎓', '#4f8fe0', '+15% Crafting',
      'Was still in class when the world ended. Reads a room, and a repair manual, equally well.',
      { wits: 2, charm: 1, strength: -1 }, { crafting: 2, diplomacy: 1 },
    ],
    [
      'scavenger', 'Scavenger', '🔍', '#d9a02f', '+15% Scavenging',
      'Grew up finding what other people threw away. Nothing goes to waste.',
      { quickness: 2, wits: 1, charm: -1 }, { scavenging: 2, stealth: 1 },
    ],
    [
      'brawler', 'Brawler', '🥊', '#e2554a', '+15% Combat',
      'Solved problems with fists long before the virus made it a survival skill.',
      { strength: 2, grit: 1, wits: -1 }, { combat: 2, leadership: 1 },
    ],
    [
      'caretaker', 'Caretaker', '💊', '#e07fa0', '+15% Diplomacy',
      "Minded younger siblings and patched up scrapes. Still can't walk past someone hurting.",
      { charm: 2, grit: 1, strength: -1 }, { diplomacy: 2, crafting: 1 },
    ],
    [
      'drifter', 'Drifter', '🥾', '#8a8f98', '+15% Stealth',
      'Never really had a home to begin with, so the collapse changed less than people think.',
      { quickness: 2, grit: 1, charm: -1 }, { stealth: 2, scavenging: 1 },
    ],
    [
      'ringleader', 'Ringleader', '🎤', '#a25fd9', '+15% Leadership',
      "The kid everyone somehow ended up following, even before there was anywhere to lead them.",
      { charm: 2, wits: 1, grit: -1 }, { leadership: 2, diplomacy: 1 },
    ],
    [
      'scout', 'Scout', '🧭', '#2fb0a8', '+15% Stealth',
      'Learned the safest paths through the ruins long before anyone paid for the knowledge. Sees a way through where others see a dead end.',
      { quickness: 2, wits: 1, strength: -1 }, { stealth: 2, scavenging: 1 },
    ],
    [
      'farmer', 'Farmer', '🌾', '#6fa83a', '+15% Farming',
      'Kept crops alive through worse than this. Knows dirt, weather, and patience better than most survivors know a gun.',
      { grit: 2, strength: 1, quickness: -1 }, { farming: 2, crafting: 1 },
    ],
    [
      'tinkerer', 'Tinkerer', '🔧', '#c98f3f', '+15% Crafting',
      'Never met a broken machine that stayed broken for long. If it still has parts, it still has a use.',
      { wits: 2, quickness: 1, grit: -1 }, { crafting: 2, scavenging: 1 },
    ],
  ];

  const insertAll = db.transaction((rows) => {
    rows.forEach(([key, name, icon, color, buffLabel, blurb, statBonuses, skillBonuses]) => {
      insert.run(key, name, blurb, icon, color, buffLabel, JSON.stringify(statBonuses), JSON.stringify(skillBonuses));
    });
  });
  insertAll(backgrounds);
}

function seedTribes() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM tribes').get();
  if (n > 0) return;

  const insert = db.prepare(`
    INSERT INTO tribes (key, name, ideology_text, detail_text, buff_label, color)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const tribes = [
    ['mallrats', 'Mallrats', 'Holed up in the ruins of a shopping mall — more family than faction.',
      "What started as a handful of kids squatting in a gutted shopping centre turned into the closest thing this city has to a neutral home base. Mallrats don't pick fights they can avoid, and they're usually the ones in the room when two other tribes need someone to talk them down.",
      '+15% Diplomacy', '#d9602f'],
    ['demon-dogz', 'Demon Dogz', 'Loud, chaotic, and proud of the fear they put in people.',
      "The Demon Dogz didn't survive the collapse by being reasonable. They took the casino because nobody else was willing to fight hard enough to keep it, and they've been daring someone to try taking it back ever since.",
      '+15% Combat', '#e2554a'],
    ['roosters', 'Roosters', 'Strutting and status-obsessed, always keeping score.',
      "Everything is a competition to the Roosters — who's got the best gear, the sharpest look, the biggest reputation. It's vanity until you realise how good they've gotten at actually backing it up.",
      '+10% Leadership', '#e0b23f'],
    ['jackals', 'Jackals', 'Fast and opportunistic, quick to pick a fight they can win.',
      "Jackals don't hold ground, they take opportunities — a supply run left unguarded, a rival tribe stretched too thin. Fast in, fast out, gone before anyone's sure what happened.",
      '+15% Stealth', '#9aa0ab'],
    ['mutants', 'Mutants', 'Painted faces, no rules, living for the chaos of it.',
      "No leader, no rules, no plan beyond the next hour — and somehow that's kept the Mutants alive longer than tribes with all three. Painted faces, borrowed scrap armor, and absolutely nothing left to lose.",
      '+10% Combat', '#b05fd9'],
    ['gulls', 'Gulls', 'Coastal scavengers who trade in whatever washes up.',
      'Whatever the tide brings in, the Gulls get first look at it. Running the docks means running the closest thing this city has to an open market, and they intend to keep it that way.',
      '+15% Scavenging', '#4f8fe0'],
    ['locos', 'Locos', 'Wild and unpredictable, feared for how little they have to lose.',
      "The Locos run the rail yards like it's already a warzone, because to them it might as well be. Nobody's ever sure what sets them off, which is exactly how they like it.",
      '+15% Combat', '#c9432f'],
    ['farm-girls', 'Farm Girls', 'Self-sufficient growers who trust dirt more than people.',
      "The Farm keeps this city fed, or the parts of it that bother to trade fairly. Farm Girls would rather be left alone to work the fields than get pulled into anyone else's fight — but they've made it clear they can end one if they have to.",
      '+15% Farming', '#6fa83a'],
    ['amazons', 'Amazons', 'A tribe of girls only — sharp-eyed and slow to trust outsiders.',
      "The Amazons don't explain themselves and don't recruit outsiders looking for family — they recruit outsiders looking for a reason to trust their own instincts again. Sharp-eyed, close-knit, and not worth underestimating.",
      '+10% Stealth', '#e07fae'],
    ['slave-traders', 'Slave Traders', 'Buy and sell labour, loyalty, and information, for a price.',
      "Everything has a price to the Slave Traders — labour, loyalty, information, people. It's the kind of tribe most others claim to hate and quietly do business with anyway.",
      '+10% Diplomacy', '#a08060'],
    ['tribe-circus', 'Tribe Circus', 'Performers and misfits who talk their way through anything.',
      "Half performance troupe, half information network, the Circus talks its way into rooms other tribes would need to fight their way into. Nobody's quite sure where the act ends and the tribe begins.",
      '+15% Diplomacy', '#2fb0a8'],
    ['ecos', 'Ecos', "Believers in living light on the land and healing what's left of it.",
      "The Ecos think the collapse was the planet correcting a mistake, and they intend to make sure it's not repeated. Camped in the treeline outside the city, equal parts survivalists and true believers.",
      '+10% Crafting', '#3f9d6a'],
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
// sector_number places a location within one of the 16 sectors on the
// Map tab's 25x25 city grid; null means it's drawn on the smaller 15x15
// "Outside the City" grid instead.
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
      tribeIdByKey('mallrats'), 10, 8, 8, 2, 3,
    ],
    [
      'horton-bailey-hotel', 'Horton Bailey Hotel',
      "Once the city's grandest hotel, its ballrooms and function rooms have changed hands more times than anyone can count.",
      null, 9, 7, 20, 2, 2,
    ],
    [
      'rail-yards', 'Rail Yards',
      'Rows of rusting freight cars and dead signal towers, right where the city gives way to the wild.',
      tribeIdByKey('locos'), 9, 10, 20, 1, 4,
    ],
    [
      'state-buildings', 'Various State Buildings',
      'Government offices and civic halls, their marble lobbies long since stripped bare. Nobody controls all of it.',
      null, 5, 2, 2, 2, 2,
    ],
    [
      'casino', 'Casino',
      'Neon signs gone dark and gaming floors picked clean of anything worth carrying.',
      tribeIdByKey('demon-dogz'), 2, 2, 15, 2, 2,
    ],
    [
      'docks', 'Docks',
      'Warehouses and loading cranes along the waterline — handy for anyone trading in whatever the tide brings in.',
      tribeIdByKey('gulls'), 10, 11, 8, 1, 3,
    ],
  ];

  // Outside the city — drawn on their own smaller 15x15 grid
  // (server/game/cityGrid.js's OUTSIDE_GRID_SIZE), positioned to avoid
  // overlapping each other or the outside minors below.
  const majorsOutside = [
    [
      'liberty', 'Liberty',
      "A town some distance from the city, found by outsiders looking for somewhere the collapse hadn't reached quite so hard.",
      null, null, 2, 2, 3, 3,
    ],
    [
      'eco-camp', 'Eco Camp',
      'A camp in the treeline, built and kept by people who never trusted the city to begin with.',
      tribeIdByKey('ecos'), null, 2, 10, 2, 2,
    ],
    [
      'eagle-mountain', 'Eagle Mountain',
      'High ground with an old observatory at the top, its dome cracked open to the sky. Cold, exposed, and a long climb.',
      null, null, 7, 2, 2, 2,
    ],
    [
      'hope-island', 'Hope Island',
      "A small island offshore, reachable only by boat, holding secrets nobody's fully worked out yet.",
      null, null, 11, 12, 2, 2,
    ],
    [
      'the-beach', 'The Beach',
      "Open sand and driftwood fires. Treated as neutral ground when tribes need to meet without it turning into a fight.",
      null, null, 13, 2, 2, 3,
    ],
    [
      'the-farm', 'The Farm',
      'Fenced fields and a working well, kept alive by people who decided growing food mattered more than defending a fortress.',
      tribeIdByKey('farm-girls'), null, 6, 7, 3, 2,
    ],
  ];

  // Generic minor locations, unclaimed at the start — most of the map's
  // actual territory-claiming targets once that reaches beyond The
  // Undercroft. Each is a single tile, positioned within its sector on the
  // city grid, or (for the handful with no sector) on the outside grid.
  const minors = [
    ['old-police-station', 'Old Police Station', 'Cells still locked, evidence room long since picked through.', 1, 17, 3],
    ['corner-store', 'Corner Store', "Boarded windows, but the door's been kicked in more than once.", 2, 5, 18],
    ['public-library', 'Public Library', 'Nobody reads anymore, but the reference section still has good maps.', 3, 3, 22],
    ['riverside-apartments', 'Riverside Apartments', 'Dozens of units, most stripped bare, a few still locked tight.', 3, 3, 24],
    ['hardware-store', 'Hardware Store', 'Picked over early, but the stockroom out back still surprises people.', 4, 22, 9],
    ['bus-depot', 'Bus Depot', 'Rows of dead buses, good for parts or sleeping rough.', 4, 22, 11],
    ['fire-station', 'Fire Station', 'Trucks are long gone, but the tools cabinet is worth checking.', 5, 5, 5],
    ['old-cinema', 'Old Cinema', 'Marquee letters have fallen off one by one. Screens are torn through.', 6, 22, 3],
    ['laundromat', 'Laundromat', "Machines rusted shut, but it's dry and mostly out of sight.", 6, 22, 5],
    ['warehouse-district', 'Warehouse District', 'Rows of shuttered loading bays. Easy to get lost in, easier to get trapped.', 7, 3, 9],
    ['high-school', 'High School', "Lockers still have names on them. Nobody's touched the gym in years.", 7, 3, 11],
    ['old-supermarket', 'Old Supermarket', 'Shelves went bare fast, but people still check the storeroom out of habit.', 8, 16, 16],
    ['old-gym', 'Old Gym', "Weights rusted in place. Someone's been keeping the mats clean, though.", 8, 16, 18],
    ['old-diner', 'Old Diner', 'Booths are falling apart, but the kitchen still has usable knives.', 11, 22, 16],
    ['playground', 'Playground', "Rusted swings creak in the wind. Nobody's kept it up.", 11, 22, 18],
    ['community-pool', 'Community Pool', 'Drained and cracked, used more as a lookout point these days.', 12, 9, 16],
    ['freeway-overpass', 'Freeway Overpass', 'High ground and good sightlines, but exposed to the weather.', 12, 9, 18],
    ['old-radio-station', 'Old Radio Station', "The antenna's still standing. Nobody's gotten the equipment working again.", 13, 16, 9],
    ['construction-site', 'Abandoned Construction Site', 'A half-built tower, scaffolding still up. Dangerous, but tall.', 13, 16, 11],
    ['electronics-store', 'Electronics Store', 'Picked clean of anything with a battery a long time ago.', 14, 22, 22],
    ['university-campus', 'University Campus', 'Lecture halls and dorms, sprawling and easy to get turned around in.', 14, 22, 24],
    ['old-hospital', 'Old Hospital', 'Wards long emptied, but the dispensary still gets checked from time to time.', 15, 9, 3],
    ['sports-stadium', 'Sports Stadium', 'Huge and echoing. Used for gatherings when the tribes can stand to share it.', 15, 9, 5],
    ['old-church', 'Old Church', "Pews mostly intact. Some people still won't go inside.", 16, 16, 22],
    ['cemetery', 'Cemetery', 'Quiet, overgrown, and mostly left alone.', 16, 16, 24],
    // Outside the city — placed on the 15x15 outside grid.
    ['roadside-motel', 'Roadside Motel', 'Rooms mostly gutted, but the sign still lights up some nights nobody can explain.', null, 5, 5],
    ['grain-silo', 'Grain Silo', 'Empty now, but it still stands tall over the fields.', null, 9, 9],
    ['truck-stop-diner', 'Truck Stop Diner', 'Picked-over vending machines and a boarded-up counter.', null, 5, 12],
    ['old-quarry', 'Old Quarry', 'A deep cut in the rock, good for hiding, bad for getting out of in a hurry.', null, 12, 7],
    ['ranger-station', 'Forest Ranger Station', 'A lookout tower and a locked supply shed, half-swallowed by the treeline.', null, 3, 7],
  ];

  const insertAll = db.transaction((rows) => rows.forEach((row) => insert.run(...row)));

  insertAll(majorsOnGrid.map(([key, name, description, tribeId, sectorNumber, row, col, rowSpan, colSpan]) =>
    [key, name, description, tribeId, sectorNumber, 'major', row, col, rowSpan, colSpan]));

  insertAll(majorsOutside.map(([key, name, description, tribeId, sectorNumber, row, col, rowSpan, colSpan]) =>
    [key, name, description, tribeId, sectorNumber, 'major', row, col, rowSpan, colSpan]));

  insertAll(minors.map(([key, name, description, sectorNumber, row, col]) =>
    [key, name, description, null, sectorNumber, 'minor', row, col, 1, 1]));
}

module.exports = seed;
