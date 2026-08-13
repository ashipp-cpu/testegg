# Tribe Prototype — Phase 1

A text-based, post-apocalyptic teen-survival browser game prototype (working title).

Phase 1 covers: username-only login, a three-step onboarding flow (callsign
→ character → tribe), one seeded starting location, and live local chat
with `/me` emotes via Socket.io.

Onboarding:
1. **Callsign** — username-only sign in, no password.
2. **Character** — name, appearance, origin story, and a background
   (Student, Scavenger, Brawler, Caretaker, Drifter, Ringleader) that sets
   starting stats and skill bonuses. No manual point allocation.
3. **Tribe** — join one of the twelve preset tribes. Nobody founds their
   own; ranks and elections come in a later phase.

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
  (gitignored) and is created/seeded automatically on first run. The
  schema changed with the background/tribe onboarding update — delete an
  existing `data/game.sqlite` before running if you have one from before.
- Sessions use `express-session`'s in-memory store — fine for a single
  process prototype, but sessions reset on restart. Swap in a persistent
  store before running more than one process.
- Tribe ranks/elections, quests, and combat are not implemented yet —
  see the phased build plan for what's next.
