const db = require('../db');
const { STARTING_TERRITORY_KEY } = require('../../config');

// Idempotent: only seeds the starting territory the first time the DB is empty.
function seed() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM territories').get();
  if (n > 0) return;

  db.prepare(`
    INSERT INTO territories (key, name, description, connections)
    VALUES (?, ?, ?, ?)
  `).run(
    STARTING_TERRITORY_KEY,
    'The Undercroft',
    "The concrete bones of a collapsed shopping centre, sunk half underground " +
      "where the sinkhole swallowed it. Emergency lighting still flickers over " +
      "cracked tile and gutted storefronts. It smells of damp cardboard and old " +
      "smoke. Whoever's left in this town ends up passing through here sooner " +
      "or later — it's the closest thing to neutral ground.",
    '[]'
  );
}

module.exports = seed;
