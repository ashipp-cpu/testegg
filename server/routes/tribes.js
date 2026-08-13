const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const characters = require('../models/character');
const tribes = require('../models/tribe');
const tribeMemberships = require('../models/tribeMembership');

router.get('/join-tribe', requireAuth, (req, res) => {
  const character = characters.getByUserId(req.session.userId);
  if (!character) return res.redirect('/characters/new');
  if (tribeMemberships.getByCharacterId(character.id)) return res.redirect('/game');

  res.render('joinTribe', { error: null, tribes: tribes.list() });
});

router.post('/join-tribe', requireAuth, (req, res) => {
  const character = characters.getByUserId(req.session.userId);
  if (!character) return res.redirect('/characters/new');
  if (tribeMemberships.getByCharacterId(character.id)) return res.redirect('/game');

  const tribe = tribes.getByKey(req.body.tribe_key || '');
  if (!tribe) {
    return res.render('joinTribe', { error: 'Pick a tribe to continue.', tribes: tribes.list() });
  }

  tribeMemberships.create(character.id, tribe.id);
  res.redirect('/game');
});

module.exports = router;
