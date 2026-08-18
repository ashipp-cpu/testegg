const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const characters = require('../models/character');
const tribes = require('../models/tribe');
const tribeMemberships = require('../models/tribeMembership');
const activity = require('../game/activity');

function wantsJson(req) {
  return req.get('Accept') === 'application/json';
}

router.get('/join-tribe', requireAuth, (req, res) => {
  const character = characters.getByUserId(req.session.userId);
  if (!character) return res.redirect('/characters/new');
  if (tribeMemberships.getByCharacterId(character.id)) return res.redirect('/game');

  res.render('joinTribe', { error: null, tribes: tribes.list() });
});

// See server/routes/characters.js for why this also has an
// Accept: application/json branch — the character creation wizard calls
// this as the second step of a single client-side flow.
router.post('/join-tribe', requireAuth, (req, res) => {
  const character = characters.getByUserId(req.session.userId);
  if (!character) {
    if (wantsJson(req)) return res.status(422).json({ error: 'Create a character first.' });
    return res.redirect('/characters/new');
  }
  if (tribeMemberships.getByCharacterId(character.id)) {
    if (wantsJson(req)) return res.json({ ok: true });
    return res.redirect('/game');
  }

  const tribe = tribes.getByKey(req.body.tribe_key || '');
  if (!tribe) {
    if (wantsJson(req)) return res.status(422).json({ error: 'Pick a tribe to continue.' });
    return res.render('joinTribe', { error: 'Pick a tribe to continue.', tribes: tribes.list() });
  }

  tribeMemberships.create(character.id, tribe.id);
  activity.log(character.id, `Joined the ${tribe.name}.`);

  if (wantsJson(req)) return res.json({ ok: true });
  res.redirect('/game');
});

module.exports = router;
