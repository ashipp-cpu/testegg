const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const characters = require('../models/character');
const tribes = require('../models/tribe');
const tribeMemberships = require('../models/tribeMembership');
const tribeElections = require('../models/tribeElection');
const tribeDiplomacy = require('../models/tribeDiplomacy');
const tribeAnnouncements = require('../models/tribeAnnouncement');
const territories = require('../models/territory');
const chatMessages = require('../models/chatMessage');
const elections = require('../game/elections');
const territoryClaims = require('../game/territoryClaims');
const tribeNews = require('../game/tribeNews');
const { hasPermission } = require('../game/permissions');

const VALID_STANCES = ['neutral', 'ally', 'rival', 'war'];

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

function buildElectionView(election, viewerCharacterId) {
  if (!election) return null;
  const candidates = tribeElections.listCandidates(election.id);
  const votes = tribeElections.listVotes(election.id);
  return {
    ...election,
    candidates: candidates.map((c) => ({
      ...c,
      voteCount: votes.filter((v) => v.candidate_character_id === c.character_id).length,
    })),
    myVotes: votes.filter((v) => v.voter_character_id === viewerCharacterId).map((v) => v.candidate_character_id),
  };
}

function buildRecallView(election, viewerCharacterId) {
  const votes = tribeElections.listVotes(election.id);
  return {
    election,
    supportCount: votes.length,
    iSupport: votes.some((v) => v.voter_character_id === viewerCharacterId),
  };
}

function buildTribeViewModel(character, membership, error) {
  const tribe = tribes.getById(membership.tribe_id);
  const members = tribeMemberships.listByTribe(tribe.id);

  const openRecalls = members
    .filter((m) => m.office === 'leader' || m.office === 'congress')
    .map((m) => {
      const election = tribeElections.getOpenRecall(tribe.id, m.character_id);
      return election ? { member: m, ...buildRecallView(election, character.id) } : null;
    })
    .filter(Boolean);

  return {
    error: error || null,
    character,
    membership,
    tribe,
    members,
    leaderElection: buildElectionView(tribeElections.getOpenElection(tribe.id, 'leader'), character.id),
    congressElection: buildElectionView(tribeElections.getOpenElection(tribe.id, 'congress'), character.id),
    openRecalls,
    territory: territories.getById(character.location_id),
    canManage: hasPermission(membership.office, 'set_policy'),
    allTribes: tribes.list().filter((t) => t.id !== tribe.id),
    diplomacy: tribeDiplomacy.listForTribe(tribe.id),
    announcements: tribeAnnouncements.listForTribe(tribe.id),
    news: chatMessages.recent('tribe', tribe.id, 15).filter((m) => m.type === 'system'),
    chatHistory: chatMessages.recent('tribe', tribe.id, 30),
  };
}

const isAjax = (req) => req.get('HX-Request') === 'true';

// Every POST action re-renders the panel fragment in place (for htmx)
// instead of redirecting, so the tribe panel reflects fresh state
// without a full page reload. Falls back to a redirect if htmx's script
// didn't load for some reason.
function respond(req, res, error) {
  if (isAjax(req)) {
    return res.render('panels/tribe', buildTribeViewModel(req.character, req.membership, error));
  }
  res.redirect(error ? `/tribe?error=${encodeURIComponent(error)}` : '/tribe');
}

router.get('/tribe', (req, res) => {
  const panelLocals = buildTribeViewModel(req.character, req.membership, req.query.error);
  res.render('shell', {
    title: panelLocals.tribe.name,
    activePanel: 'tribe',
    character: req.character,
    membership: req.membership,
    panelPartial: 'panels/tribe',
    panelLocals,
  });
});

router.get('/tribe/panel', (req, res) => {
  res.render('panels/tribe', buildTribeViewModel(req.character, req.membership, req.query.error));
});

router.post('/tribe/policy', (req, res) => {
  const { membership } = req;
  if (hasPermission(membership.office, 'set_policy')) {
    tribes.setPolicy(membership.tribe_id, (req.body.policy_text || '').trim().slice(0, 2000));
  }
  respond(req, res);
});

router.post('/tribe/announcements', (req, res) => {
  const { character, membership } = req;
  if (hasPermission(membership.office, 'post_announcement')) {
    const body = (req.body.body || '').trim().slice(0, 1000);
    if (body) {
      tribeAnnouncements.create(membership.tribe_id, character.id, body);
      tribeNews.announce(membership.tribe_id, `${character.name} posted a new announcement.`);
    }
  }
  respond(req, res);
});

router.post('/tribe/diplomacy', (req, res) => {
  const { character, membership } = req;
  if (!hasPermission(membership.office, 'set_diplomacy_stance')) return respond(req, res);

  const otherTribeId = parseInt(req.body.other_tribe_id, 10);
  const stance = req.body.stance;
  if (!otherTribeId || otherTribeId === membership.tribe_id || !VALID_STANCES.includes(stance)) {
    return respond(req, res);
  }

  const otherTribe = tribes.getById(otherTribeId);
  if (!otherTribe) return respond(req, res);

  if (stance === 'neutral') {
    tribeDiplomacy.clearStance(membership.tribe_id, otherTribeId);
  } else {
    tribeDiplomacy.setStance(membership.tribe_id, otherTribeId, stance);
  }
  tribeNews.announce(membership.tribe_id, `${character.name} set relations with ${otherTribe.name} to ${stance}.`);
  respond(req, res);
});

router.post('/tribe/elections/:office/nominate', (req, res) => {
  const { character, membership } = req;
  const office = req.params.office;
  if (!['leader', 'congress'].includes(office)) return respond(req, res);

  try {
    elections.nominate(membership.tribe_id, office, character.id);
  } catch (err) {
    return respond(req, res, err.message);
  }
  respond(req, res);
});

router.post('/tribe/elections/:electionId/vote', (req, res) => {
  const { character } = req;
  const electionId = parseInt(req.params.electionId, 10);
  const candidateId = parseInt(req.body.candidate_character_id, 10);

  try {
    elections.castVote(electionId, character.id, candidateId);
  } catch (err) {
    return respond(req, res, err.message);
  }
  respond(req, res);
});

router.post('/tribe/elections/:electionId/retract', (req, res) => {
  const { character } = req;
  const electionId = parseInt(req.params.electionId, 10);
  const candidateId = parseInt(req.body.candidate_character_id, 10);
  elections.retractVote(electionId, character.id, candidateId);
  respond(req, res);
});

router.post('/tribe/recall', (req, res) => {
  const { character, membership } = req;
  const targetCharacterId = parseInt(req.body.target_character_id, 10);

  try {
    elections.startRecall(membership.tribe_id, targetCharacterId, character.id);
  } catch (err) {
    return respond(req, res, err.message);
  }
  respond(req, res);
});

router.post('/tribe/recall/:electionId/vote', (req, res) => {
  const { character } = req;
  const electionId = parseInt(req.params.electionId, 10);

  try {
    elections.castRecallVote(electionId, character.id);
  } catch (err) {
    return respond(req, res, err.message);
  }
  respond(req, res);
});

router.post('/tribe/recall/:electionId/retract', (req, res) => {
  const { character } = req;
  const electionId = parseInt(req.params.electionId, 10);
  elections.retractRecallVote(electionId, character.id);
  respond(req, res);
});

router.post('/tribe/territory/claim', (req, res) => {
  const { character, membership } = req;
  if (hasPermission(membership.office, 'claim_territory')) {
    const territory = territories.getById(character.location_id);
    territoryClaims.resolveClaim(character, membership.tribe_id, territory);
  }
  respond(req, res);
});

module.exports = router;
