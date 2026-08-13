const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const characters = require('../models/character');
const territories = require('../models/territory');
const chatMessages = require('../models/chatMessage');
const backgrounds = require('../models/background');
const characterSkills = require('../models/characterSkill');
const tribeMemberships = require('../models/tribeMembership');

router.get('/game', requireAuth, (req, res) => {
  const character = characters.getByUserId(req.session.userId);
  if (!character) return res.redirect('/characters/new');

  const membership = tribeMemberships.getByCharacterId(character.id);
  if (!membership) return res.redirect('/join-tribe');

  const territory = territories.getById(character.location_id);
  const history = chatMessages.recent('local', territory.id, 30);
  const background = backgrounds.getById(character.background_id);
  const skills = characterSkills.listForCharacter(character.id);

  res.render('game', { character, territory, history, background, skills, membership });
});

module.exports = router;
