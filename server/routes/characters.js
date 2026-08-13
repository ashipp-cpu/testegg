const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const characters = require('../models/character');
const territories = require('../models/territory');
const backgrounds = require('../models/background');
const skills = require('../models/skill');
const characterSkills = require('../models/characterSkill');
const { STARTING_TERRITORY_KEY } = require('../config');
const { deriveVitals } = require('../game/stats');
const { computeStats, computeSkillLevels } = require('../game/backgrounds');

function defaultForm() {
  return { name: '', appearance_text: '', origin_story: '', background_key: '' };
}

router.get('/characters/new', requireAuth, (req, res) => {
  const existing = characters.getByUserId(req.session.userId);
  if (existing) return res.redirect('/join-tribe');

  res.render('createCharacter', {
    error: null,
    backgrounds: backgrounds.list(),
    form: defaultForm(),
  });
});

router.post('/characters', requireAuth, (req, res) => {
  const existing = characters.getByUserId(req.session.userId);
  if (existing) return res.redirect('/join-tribe');

  const name = (req.body.name || '').trim();
  const appearance_text = (req.body.appearance_text || '').trim();
  const origin_story = (req.body.origin_story || '').trim();
  const background_key = req.body.background_key || '';
  const background = background_key ? backgrounds.getByKey(background_key) : null;

  const renderError = (error) =>
    res.render('createCharacter', {
      error,
      backgrounds: backgrounds.list(),
      form: { name, appearance_text, origin_story, background_key },
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
  if (!background) {
    return renderError('Pick a background to continue.');
  }

  const territory = territories.getByKey(STARTING_TERRITORY_KEY);
  const stats = computeStats(background);
  const vitals = deriveVitals(stats);

  const character = characters.create({
    user_id: req.session.userId,
    name,
    appearance_text,
    origin_story,
    background_id: background.id,
    stat_strength: stats.strength,
    stat_quickness: stats.quickness,
    stat_wits: stats.wits,
    stat_charm: stats.charm,
    stat_grit: stats.grit,
    hp: vitals.hp,
    energy: vitals.energy,
    location_id: territory.id,
  });

  characterSkills.createMany(character.id, computeSkillLevels(background, skills.list()));

  res.redirect('/join-tribe');
});

module.exports = router;
