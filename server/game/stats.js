const STAT_KEYS = ['strength', 'quickness', 'wits', 'charm', 'grit'];
const MIN_STAT = 1;
const MAX_STAT = 10;

function deriveVitals(stats) {
  return {
    hp: 20 + stats.grit,
    energy: 10 + stats.quickness,
  };
}

module.exports = { STAT_KEYS, MIN_STAT, MAX_STAT, deriveVitals };
