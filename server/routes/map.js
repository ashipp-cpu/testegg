const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const characters = require('../models/character');
const territories = require('../models/territory');
const tribeMemberships = require('../models/tribeMembership');
const { GRID_SIZE, SECTORS } = require('../game/cityGrid');

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
  const locations = territories.listAll();
  const onGrid = locations.filter((loc) => loc.grid_row !== null);

  const sectors = SECTORS.map((sector) => ({
    ...sector,
    locations: onGrid.filter((loc) => loc.sector_number === sector.number),
  }));

  return {
    character,
    gridSize: GRID_SIZE,
    sectors,
    gridLocations: onGrid,
    outside: locations.filter((loc) => loc.tier === 'major' && loc.sector_number === null),
    minors: locations.filter((loc) => loc.tier === 'minor'),
    locations,
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
