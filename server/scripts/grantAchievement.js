// Awards a meta/community achievement (Alpha Tester, Bug Hunter...) to a
// player's character. There's no admin role/UI yet, so this is the
// pragmatic way to grant one until that exists.
//
// Usage: node server/scripts/grantAchievement.js <username> <achievement-key>
const db = require('../db/db');

const [, , username, achievementKey] = process.argv;

if (!username || !achievementKey) {
  console.error('Usage: node server/scripts/grantAchievement.js <username> <achievement-key>');
  const keys = db.prepare('SELECT key FROM achievements').all().map((a) => a.key);
  console.error(`Known achievement keys: ${keys.join(', ')}`);
  process.exit(1);
}

const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
if (!user) {
  console.error(`No user "${username}".`);
  process.exit(1);
}

const character = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(user.id);
if (!character) {
  console.error(`"${username}" doesn't have a character yet.`);
  process.exit(1);
}

const achievement = db.prepare('SELECT * FROM achievements WHERE key = ?').get(achievementKey);
if (!achievement) {
  const keys = db.prepare('SELECT key FROM achievements').all().map((a) => a.key);
  console.error(`No achievement "${achievementKey}". Known keys: ${keys.join(', ')}`);
  process.exit(1);
}

db.prepare(
  'INSERT OR IGNORE INTO character_achievements (character_id, achievement_id) VALUES (?, ?)'
).run(character.id, achievement.id);

console.log(`Granted "${achievement.name}" to ${character.name} (${username}).`);
