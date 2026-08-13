const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const characters = require('../models/character');
const territories = require('../models/territory');
const chatMessages = require('../models/chatMessage');

router.get('/game', requireAuth, (req, res) => {
  const character = characters.getByUserId(req.session.userId);
  if (!character) return res.redirect('/characters/new');

  const territory = territories.getById(character.location_id);
  const history = chatMessages.recent('local', territory.id, 30);

  res.render('game', { character, territory, history });
});

module.exports = router;
