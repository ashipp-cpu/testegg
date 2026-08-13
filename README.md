# Tribe Prototype — Phase 3

A text-based, post-apocalyptic teen-survival browser game prototype (working title).

Phase 1 covers: username-only login, a three-step onboarding flow (callsign
→ character → tribe), one seeded starting location, and live local chat
with `/me` emotes via Socket.io.

Phase 3 adds a full tribe panel (`/tribe`): membership roster, a Leader +
3-seat Congress elected by the tribe (Congress is titular for now — the
Leader holds all actionable permissions), recall votes to remove a sitting
officer, a tribe chat channel separate from local chat, a Leader-editable
policy statement, one-directional alliance/rival/war stances toward other
tribes, Leader announcements, an automatic news feed of tribe events, and
territory claiming — unclaimed territory is taken outright, a held one is
"contested" via a single instant resolution check (not full combat, which
is a later phase).

Onboarding:
1. **Callsign** — username-only sign in, no password.
2. **Character** — name, appearance, origin story, and a background
   (Student, Scavenger, Brawler, Caretaker, Drifter, Ringleader) that sets
   starting stats and skill bonuses. No manual point allocation.
3. **Tribe** — join one of the twelve preset tribes. Nobody founds their
   own.

## Run it

```
npm install
npm start
```

Then open http://localhost:3000. Set `PORT` and `SESSION_SECRET` via
environment variables or a `.env`-style setup if you wire one in later
(see `.env.example`); sensible defaults are used otherwise.

Open the same URL in a few browser windows (or normal + incognito) with
different callsigns, join the same tribe, and use `/tribe` to run
elections, vote, and claim territory together.

## Profiles

Every character has a public profile at `/profile/:id` (or `/profile` for
your own) — name, tribe affiliation, appearance/origin text, stats, skills,
a "Recent Actions" feed, friends/enemies, last login time, and any earned
achievements. Anyone can view anyone else's profile; character names
throughout the app (tribe roster, friends/enemies lists) link to it.

- **Recent Actions** is a real activity log, not decorative — it's
  populated by `server/game/activity.js`, called from the same places
  `tribeNews.announce()` is (joining a tribe, winning an election, being
  recalled, claiming/losing territory), just phrased for the acting
  character's own page.
- **Friends/Enemies** are one-directional (your own read on another
  character, mirroring how tribe alliance/rival stances work), set from
  the "Relationship" section on someone else's profile.
- **Achievements** are meta/community badges (Alpha Tester, Bug Hunter,
  Idea Spark...) rather than anything earned through gameplay. There's no
  admin role/UI yet, so they're granted from the command line:
  `npm run grant-achievement -- <username> <achievement-key>` (run it with
  no arguments to list valid keys).

## UI architecture

The Camp (`/game`) and Tribe (`/tribe`) screens share one persistent shell
(`public/views/shell.ejs`) — the sidebar, top HUD bar, and the Socket.io
connection load once and never reload while you're playing. Navigating
between them, and every action inside the Tribe panel (voting, nominating,
claiming territory, posting an announcement...), is handled by
[htmx](https://htmx.org): a click or form submit fetches just the updated
panel fragment and swaps it into `#panel-root` in place, instead of doing a
full page navigation. Server routes render the same view twice — a full
page (`GET /game`, `GET /tribe`) for a fresh load/bookmark/refresh, and a
bare fragment (`GET /game/panel`, `GET /tribe/panel`, and the `HX-Request`
branch of every `POST /tribe/...` handler) for htmx swaps. htmx is vendored
locally (`node_modules/htmx.org`, served at `/vendor/htmx`), not loaded
from a CDN.

## Notes on this phase

- One character per account. SQLite database lives at `data/game.sqlite`
  (gitignored) and is created/seeded automatically on first run. The
  schema changed again with Phase 3 — delete an existing
  `data/game.sqlite` before running if you have one from before.
- Sessions use `express-session`'s in-memory store — fine for a single
  process prototype, but sessions reset on restart. Swap in a persistent
  store before running more than one process.
- Elections resolve synchronously as votes are cast (majority for Leader,
  quorum + top vote-getters for Congress) — no scheduler is involved.
  Recall works the same way in reverse.
- Alliance/rival/war stances are one-directional (your tribe's own read
  on another) — mutual treaty negotiation is a later phase.
- Only one territory exists so far (The Undercroft), and there's no
  player movement between locations yet, so "contested" claiming is
  currently only meaningful when a second tribe's Leader also happens to
  be present — which, with a single starting location, is everyone.
- Quests and full combat encounters are not implemented yet — see the
  phased build plan for what's next.
