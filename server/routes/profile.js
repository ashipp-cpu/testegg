const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const characters = require('../models/character');
const users = require('../models/user');
const backgrounds = require('../models/background');
const characterSkills = require('../models/characterSkill');
const tribeMemberships = require('../models/tribeMembership');
const characterActivity = require('../models/characterActivity');
const characterRelationships = require('../models/characterRelationship');
const achievements = require('../models/achievement');

const VALID_RELATIONS = ['friend', 'enemy'];

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

function buildProfileViewModel(viewerCharacter, profileCharacterId) {
  const profileCharacter = characters.getById(profileCharacterId);
  if (!profileCharacter) return null;

  const isSelf = viewerCharacter.id === profileCharacter.id;

  return {
    profileCharacter,
    profileUser: users.findById(profileCharacter.user_id),
    profileMembership: tribeMemberships.getByCharacterId(profileCharacter.id),
    background: backgrounds.getById(profileCharacter.background_id),
    skills: characterSkills.listForCharacter(profileCharacter.id),
    activity: characterActivity.listForCharacter(profileCharacter.id, 15),
    friends: characterRelationships.listForCharacter(profileCharacter.id, 'friend'),
    enemies: characterRelationships.listForCharacter(profileCharacter.id, 'enemy'),
    earnedAchievements: achievements.listForCharacter(profileCharacter.id),
    isSelf,
    myRelation: isSelf ? null : characterRelationships.getRelation(viewerCharacter.id, profileCharacter.id),
  };
}

router.get('/profile', (req, res) => {
  res.redirect(`/profile/${req.character.id}`);
});

router.get('/profile/:id', (req, res) => {
  const vm = buildProfileViewModel(req.character, parseInt(req.params.id, 10));
  if (!vm) return res.status(404).send('Character not found.');

  res.render('shell', {
    title: vm.profileCharacter.name,
    activePanel: 'profile',
    character: req.character,
    membership: req.membership,
    panelPartial: 'panels/profile',
    panelLocals: vm,
  });
});

router.get('/profile/:id/panel', (req, res) => {
  const vm = buildProfileViewModel(req.character, parseInt(req.params.id, 10));
  if (!vm) return res.status(404).send('Character not found.');
  res.render('panels/profile', vm);
});

router.post('/profile/:id/relationship', (req, res) => {
  const targetId = parseInt(req.params.id, 10);

  if (targetId !== req.character.id) {
    if (req.body.relation === 'clear') {
      characterRelationships.clearRelation(req.character.id, targetId);
    } else if (VALID_RELATIONS.includes(req.body.relation)) {
      characterRelationships.setRelation(req.character.id, targetId, req.body.relation);
    }
  }

  if (req.get('HX-Request') === 'true') {
    const vm = buildProfileViewModel(req.character, targetId);
    if (!vm) return res.status(404).send('Character not found.');
    return res.render('panels/profile', vm);
  }
  res.redirect(`/profile/${targetId}`);
});

module.exports = router;
