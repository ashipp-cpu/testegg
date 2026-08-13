const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const characters = require('../models/character');
const territories = require('../models/territory');
const { STARTING_TERRITORY_KEY } = require('../config');
const {
  STAT_KEYS,
  POINT_POOL,
  MIN_STAT,
  MAX_STAT,
  validateStats,
  deriveVitals,
} = require('../game/stats');

function defaultForm() {
  return {
    name: '',
    appearance_text: '',
    origin_story: '',
    stats: Object.fromEntries(STAT_KEYS.map((key) => [key, 5])),
  };
}

router.get('/characters/new', requireAuth, (req, res) => {
  const existing = characters.getByUserId(req.session.userId);
  if (existing) return res.redirect('/game');

  res.render('createCharacter', {
    error: null,
    statKeys: STAT_KEYS,
    pointPool: POINT_POOL,
    minStat: MIN_STAT,
    maxStat: MAX_STAT,
    form: defaultForm(),
  });
});

router.post('/characters', requireAuth, (req, res) => {
  const existing = characters.getByUserId(req.session.userId);
  if (existing) return res.redirect('/game');

  const name = (req.body.name || '').trim();
  const appearance_text = (req.body.appearance_text || '').trim();
  const origin_story = (req.body.origin_story || '').trim();
  const stats = {};
  for (const key of STAT_KEYS) {
    stats[key] = parseInt(req.body[`stat_${key}`], 10);
  }

  const renderError = (error) =>
    res.render('createCharacter', {
      error,
      statKeys: STAT_KEYS,
      pointPool: POINT_POOL,
      minStat: MIN_STAT,
      maxStat: MAX_STAT,
      form: { name, appearance_text, origin_story, stats },
    });

  if (name.length < 2 || name.length > 30) {
    return renderError('Name must be between 2 and 30 characters.');
  }
  if (appearance_text.length < 10) {
    return renderError('Give a bit more description of how your character looks.');
  }
  if (origin_story.length < 10) {
    return renderError('Give a bit more background on where your character came from.');
  }

  const statError = validateStats(stats);
  if (statError) return renderError(statError);

  const territory = territories.getByKey(STARTING_TERRITORY_KEY);
  const vitals = deriveVitals(stats);

  characters.create({
    user_id: req.session.userId,
    name,
    appearance_text,
    origin_story,
    stat_strength: stats.strength,
    stat_quickness: stats.quickness,
    stat_wits: stats.wits,
    stat_charm: stats.charm,
    stat_grit: stats.grit,
    hp: vitals.hp,
    energy: vitals.energy,
    location_id: territory.id,
  });

  res.redirect('/game');
});

module.exports = router;
