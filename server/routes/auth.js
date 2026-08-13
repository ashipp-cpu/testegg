const express = require('express');
const router = express.Router();
const users = require('../models/user');
const characters = require('../models/character');

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/game');
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const username = (req.body.username || '').trim();
  if (!USERNAME_PATTERN.test(username)) {
    return res.render('login', {
      error: 'Username must be 3-20 characters: letters, numbers, underscores.',
    });
  }

  const user = users.findOrCreateByUsername(username);
  req.session.userId = user.id;

  const character = characters.getByUserId(user.id);
  res.redirect(character ? '/game' : '/characters/new');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
