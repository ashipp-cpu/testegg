const STAT_KEYS = ['strength', 'quickness', 'wits', 'charm', 'grit'];
const POINT_POOL = 25;
const MIN_STAT = 1;
const MAX_STAT = 10;

// Returns an error message string, or null if the allocation is valid.
function validateStats(stats) {
  for (const key of STAT_KEYS) {
    const value = stats[key];
    if (!Number.isInteger(value) || value < MIN_STAT || value > MAX_STAT) {
      return `${key} must be a whole number between ${MIN_STAT} and ${MAX_STAT}.`;
    }
  }
  const total = STAT_KEYS.reduce((sum, key) => sum + stats[key], 0);
  if (total !== POINT_POOL) {
    return `Stat points must add up to exactly ${POINT_POOL} (currently ${total}).`;
  }
  return null;
}

function deriveVitals(stats) {
  return {
    hp: 20 + stats.grit,
    energy: 10 + stats.quickness,
  };
}

module.exports = { STAT_KEYS, POINT_POOL, MIN_STAT, MAX_STAT, validateStats, deriveVitals };
