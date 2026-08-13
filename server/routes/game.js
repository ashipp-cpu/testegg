const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const characters = require('../models/character');
const territories = require('../models/territory');
const chatMessages = require('../models/chatMessage');
const backgrounds = require('../models/background');
const characterSkills = require('../models/characterSkill');
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

function buildCampViewModel(character) {
  const territory = territories.getById(character.location_id);
  return {
    character,
    territory,
    history: chatMessages.recent('local', territory.id, 30),
    background: backgrounds.getById(character.background_id),
    skills: characterSkills.listForCharacter(character.id),
  };
}

// Full page load: persistent chrome + the Camp panel embedded inside it.
router.get('/game', (req, res) => {
  res.render('shell', {
    title: req.character.name,
    activePanel: 'camp',
    character: req.character,
    membership: req.membership,
    panelPartial: 'panels/camp',
    panelLocals: buildCampViewModel(req.character),
  });
});

// Fragment load: just the panel's inner HTML, swapped in by htmx when
// navigating from elsewhere in the app without a full page reload.
router.get('/game/panel', (req, res) => {
  res.render('panels/camp', buildCampViewModel(req.character));
});

module.exports = router;
