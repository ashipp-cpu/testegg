const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const characters = require('../models/character');
const territories = require('../models/territory');
const backgrounds = require('../models/background');
const tribes = require('../models/tribe');
const skills = require('../models/skill');
const characterSkills = require('../models/characterSkill');
const { STARTING_TERRITORY_KEY } = require('../config');
const { deriveVitals } = require('../game/stats');
const { computeStats, computeSkillLevels } = require('../game/backgrounds');
const activity = require('../game/activity');

const GENDERS = ['male', 'female', 'nonbinary', 'other'];

function wantsJson(req) {
  return req.get('Accept') === 'application/json';
}

router.get('/characters/new', requireAuth, (req, res) => {
  const existing = characters.getByUserId(req.session.userId);
  if (existing) return res.redirect('/join-tribe');

  res.render('createCharacter', {
    backgrounds: backgrounds.list(),
    tribes: tribes.list(),
  });
});

// Character creation and tribe joining are one wizard on the client (see
// public/js/wizard.js), but stay two plain POSTs server-side so the
// existing /join-tribe fallback (for a character stuck without a tribe)
// keeps working untouched. The wizard calls both in sequence with
// Accept: application/json and expects a JSON body back instead of the
// classic render-on-error/redirect-on-success pair.
router.post('/characters', requireAuth, (req, res) => {
  const existing = characters.getByUserId(req.session.userId);
  if (existing) {
    if (wantsJson(req)) return res.json({ ok: true });
    return res.redirect('/join-tribe');
  }

  const name = (req.body.name || '').trim();
  const gender = GENDERS.includes(req.body.gender) ? req.body.gender : '';
  const description = (req.body.description || '').trim();
  const background_key = req.body.background_key || '';
  const background = background_key ? backgrounds.getByKey(background_key) : null;

  const fail = (error) => {
    if (wantsJson(req)) return res.status(422).json({ error });
    return res.redirect('/characters/new');
  };

  if (name.length < 2 || name.length > 30) {
    return fail('Name must be between 2 and 30 characters.');
  }
  if (!gender) {
    return fail('Pick a gender to continue.');
  }
  if (description.length < 10) {
    return fail('Give a bit more description of your character.');
  }
  if (!background) {
    return fail('Pick a background to continue.');
  }

  const territory = territories.getByKey(STARTING_TERRITORY_KEY);
  const stats = computeStats(background);
  const vitals = deriveVitals(stats);

  const character = characters.create({
    user_id: req.session.userId,
    name,
    gender,
    description,
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
  activity.log(character.id, 'Emerged into the ruins.');

  if (wantsJson(req)) return res.json({ ok: true });
  res.redirect('/join-tribe');
});

module.exports = router;
