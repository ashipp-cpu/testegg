# Tribe Prototype — Phase 1

A text-based, post-apocalyptic teen-survival browser game prototype (working title).

Phase 1 covers: username-only login, character creation (appearance, origin
story, stat allocation), one seeded starting location, and live local chat
with `/me` emotes via Socket.io.

## Run it

```
npm install
npm start
```

Then open http://localhost:3000. Set `PORT` and `SESSION_SECRET` via
environment variables or a `.env`-style setup if you wire one in later
(see `.env.example`); sensible defaults are used otherwise.

Open the same URL in two browser windows (or one normal + one incognito)
with different callsigns to see chat sync between them.

## Notes on this phase

- One character per account. SQLite database lives at `data/game.sqlite`
  (gitignored) and is created/seeded automatically on first run.
- Sessions use `express-session`'s in-memory store — fine for a single
  process prototype, but sessions reset on restart. Swap in a persistent
  store before running more than one process.
- Tribes, skills/traits, quests, and combat are not implemented yet —
  see the phased build plan for what's next.
