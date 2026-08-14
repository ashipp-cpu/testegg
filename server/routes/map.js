const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const characters = require('../models/character');
const territories = require('../models/territory');
const tribeMemberships = require('../models/tribeMembership');

function loadContext(req, res, next) {
  const character = characters.getByUserId(req.session.userId);
  if (!character) return res.redirect('/characters/new');

  const membership = tribeMemberships.getByCharacterId(character.id);
  if (!membership) return res.redirect('/join-tribe');

  req.character = character;
  req.membership = membership;
  next();
}

router.use(requireAuth, loadContext);

function buildMapViewModel(character) {
  return {
    character,
    locations: territories.listMapped(),
  };
}

router.get('/map', (req, res) => {
  res.render('shell', {
    title: 'Map',
    activePanel: 'map',
    character: req.character,
    membership: req.membership,
    panelPartial: 'panels/map',
    panelLocals: buildMapViewModel(req.character),
  });
});

router.get('/map/panel', (req, res) => {
  res.render('panels/map', buildMapViewModel(req.character));
});

module.exports = router;
