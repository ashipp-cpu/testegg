const { STAT_KEYS, MIN_STAT, MAX_STAT } = require('./stats');

const BASE_STAT = 5;
const BASE_SKILL_LEVEL = 1;

// Every stat starts at BASE_STAT, then the background's deltas are applied
// and clamped — background choice fully determines starting stats.
function computeStats(background) {
  const bonuses = JSON.parse(background.stat_bonuses);
  const stats = {};
  for (const key of STAT_KEYS) {
    const value = BASE_STAT + (bonuses[key] || 0);
    stats[key] = Math.min(MAX_STAT, Math.max(MIN_STAT, value));
  }
  return stats;
}

// Every skill starts at BASE_SKILL_LEVEL, boosted by the background's bonuses.
function computeSkillLevels(background, skills) {
  const bonuses = JSON.parse(background.skill_bonuses);
  return skills.map((skill) => ({
    skill_id: skill.id,
    level: Math.max(0, BASE_SKILL_LEVEL + (bonuses[skill.key] || 0)),
  }));
}

module.exports = { computeStats, computeSkillLevels };
