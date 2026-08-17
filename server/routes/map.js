const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const characters = require('../models/character');
const territories = require('../models/territory');
const tribeMemberships = require('../models/tribeMembership');
const { GRID_SIZE, OUTSIDE_GRID_SIZE, SECTORS } = require('../game/cityGrid');

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

// Center point of a location's footprint, in tile units (0-indexed), for
// positioning things like demo route lines inside an SVG overlay whose
// viewBox matches the grid's tile coordinate system 1:1.
function centerOf(loc) {
  return {
    x: loc.grid_col - 1 + loc.grid_col_span / 2,
    y: loc.grid_row - 1 + loc.grid_row_span / 2,
  };
}

function buildMapViewModel(character) {
  const locations = territories.listAll();
  const onGrid = locations.filter((loc) => loc.grid_row !== null && loc.sector_number !== null);
  const onOutsideGrid = locations.filter((loc) => loc.grid_row !== null && loc.sector_number === null);

  const sectors = SECTORS.map((sector) => ({
    ...sector,
    locations: onGrid.filter((loc) => loc.sector_number === sector.number),
  }));

  const byKey = (key) => locations.find((loc) => loc.key === key);
  const docks = byKey('docks');
  const casino = byKey('casino');
  const railYards = byKey('rail-yards');
  const mall = byKey('the-mall');

  const demo = docks && casino && railYards && mall ? {
    caravan: { from: centerOf(docks), to: centerOf(casino) },
    attack: { from: centerOf(railYards), to: centerOf(mall) },
    battle: centerOf(mall),
  } : null;

  return {
    character,
    gridSize: GRID_SIZE,
    outsideGridSize: OUTSIDE_GRID_SIZE,
    sectors,
    gridLocations: onGrid,
    outsideGridLocations: onOutsideGrid,
    demo,
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
