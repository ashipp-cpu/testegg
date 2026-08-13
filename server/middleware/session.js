const session = require('express-session');

// MemoryStore is fine for a single-process prototype; sessions reset on
// restart. Swap in a persistent store before running more than one process.
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
});

module.exports = sessionMiddleware;
