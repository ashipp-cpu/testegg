const characterActivity = require('../models/characterActivity');

// Appends to a character's own "Recent Actions" feed on their profile.
// Called alongside server/game/tribeNews.js at the same action sites,
// phrased for the acting character's own page rather than a tribe feed.
function log(characterId, body) {
  return characterActivity.create(characterId, body);
}

module.exports = { log };
