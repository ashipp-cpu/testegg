const territories = require('../models/territory');
const characterSkills = require('../models/characterSkill');
const tribeNews = require('./tribeNews');
const activity = require('./activity');

const HOME_ADVANTAGE = 3;

function rollD6() {
  return 1 + Math.floor(Math.random() * 6);
}

// Unclaimed territory is taken outright. A held territory is "contested":
// a single instant resolution check (attacker's own combat + leadership,
// plus a die roll, against the defending tribe's average combat skill
// plus a home-turf bonus) rather than a full combat encounter — that's a
// later phase.
function resolveClaim(character, tribeId, territory) {
  if (territory.controlling_tribe_id === tribeId) {
    return { success: false, contested: false, reason: 'Your tribe already holds this territory.' };
  }

  if (!territory.controlling_tribe_id) {
    territories.setControllingTribe(territory.id, tribeId);
    tribeNews.announce(tribeId, `${character.name} claimed ${territory.name} for the tribe.`);
    activity.log(character.id, `Claimed ${territory.name} for the tribe.`);
    return { success: true, contested: false };
  }

  const attackerScore =
    characterSkills.getLevel(character.id, 'combat') +
    characterSkills.getLevel(character.id, 'leadership') +
    rollD6();
  const defenderScore =
    Math.round(characterSkills.averageForTribe(territory.controlling_tribe_id, 'combat')) + HOME_ADVANTAGE;

  const success = attackerScore > defenderScore;
  if (success) {
    territories.setControllingTribe(territory.id, tribeId);
    tribeNews.announce(tribeId, `${character.name} seized ${territory.name} (${attackerScore} vs ${defenderScore}).`);
    tribeNews.announce(
      territory.controlling_tribe_id,
      `${territory.name} was lost to a rival tribe (${attackerScore} vs ${defenderScore}).`
    );
    activity.log(character.id, `Seized ${territory.name} from a rival tribe.`);
  } else {
    tribeNews.announce(
      tribeId,
      `${character.name}'s attempt to take ${territory.name} failed (${attackerScore} vs ${defenderScore}).`
    );
    activity.log(character.id, `Failed to take ${territory.name}.`);
  }

  return { success, contested: true, attackerScore, defenderScore };
}

module.exports = { resolveClaim };
