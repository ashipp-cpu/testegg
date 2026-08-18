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
2. **Character creation** — a single fading 4-screen wizard
   (`createCharacter.ejs` + `public/js/wizard.js`, see "Character
   creation wizard" below) covering name/gender/description, a
   background pick (9 choices, up from 6, each with an icon, color, and
   a cosmetic "buff" tag — Student, Scavenger, Brawler, Caretaker,
   Drifter, Ringleader, Scout, Farmer, Tinkerer), and a tribe pick (all
   twelve, each with its own buff tag and an expanding detail panel).
   Stats and skill bonuses come entirely from the background; there's no
   manual point allocation.

## Character creation wizard

`/characters/new` is one page with four screens (identity → background →
tribe → "ready"), only one visible at a time; "Next"/"Back" cross-fade
between them client-side with no page reload or network call until the
very last step. Clicking "Let's go" on the ready screen fires the
existing `POST /characters` and `POST /join-tribe` endpoints back to
back (both now branch on an `Accept: application/json` header to return
JSON instead of redirecting, purely for the wizard's fetch calls — a
plain form POST to either still works exactly as before) and lands on
`/game`. A validation failure on either call jumps back to the relevant
screen with an inline error instead of losing the user's progress.
Backgrounds and tribes both carry a `buff_label` (e.g. "+15% Farming")
purely for the card display — for backgrounds it restates the dominant
`skill_bonuses` entry; tribes don't currently grant any mechanical
bonus, so theirs is flavor only. `/join-tribe` alone still exists as a
fallback for the edge case of a character that somehow exists without a
tribe.

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
your own) — name, gender, tribe affiliation, description, stats, skills,
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

## Map

`/map` renders two side-by-side tile grids — a "live map" look (dark,
monospace, glowing accents) meant to grow into showing territory,
events, caravans, and markets over time. The larger one, "The City," is
25x25 tiles. 16 sectors tile it as irregular, non-uniform-sized colored
regions (hand-placed in `server/game/cityGrid.js`, not a plain
checkerboard) with a text label in the corner. The smaller one, "Outside
the City," is a plain 15x15 tile grid (no sectors) sitting to its left
on wide screens, or stacked above it on narrower ones.

Every location — not just the principal ("major") ones — is drawn
directly on one of the two grids now; nothing is left in an off-grid
list. Majors get multi-tile footprints sized to scale (The Mall is a
2x3 block, The Undercroft a 2x2, Rail Yards a 1x4 strip, etc.) with
their name on the tile; minors are small unlabeled dot markers (hover
for a name tooltip) scattered through their sector, or through the
outside grid if they have no sector. Clicking anything — major, minor,
on either grid — opens its sector, tier, description, and controlling
tribe in a modal overlay instead of a page section; your character's
current location is highlighted and shown by default. A "Run Demo"
button below the map toggles a preview overlay on the city grid: an
animated blue line for a trade caravan, a red one for a raid, a pulsing
battle marker at the target, and tribe-name flags on every claimed
building — all fake data, just a look at how the live version should
read once caravans, raids, and territory control are real.

43 locations are seeded: 12 named/major locations plus The Undercroft,
pulled from *The Tribe* (1999 NZ TV series) as a fan project using the
real names as-is (location descriptions are original text, not copied
from any wiki), and 30 generic minor locations (abandoned stores, an
old hospital, a university campus...) invented purely to give territory
claiming somewhere to happen once it reaches beyond The Undercroft. A
handful of majors are pre-seeded as already held by their
lore-appropriate tribe (The Mall/Mallrats, Rail Yards/Locos, Casino/
Demon Dogz, Eco Camp/Ecos, The Farm/Farm Girls, Docks/Gulls); everything
else, including all 30 minors, starts unclaimed.

Locations are `territories` rows with a `sector_number` (1-16, or null
for the outside grid), a `tier` ('major'/'minor'), and `grid_row`/
`grid_col`/`grid_row_span`/`grid_col_span` (1-indexed, matching CSS
grid-row/grid-column) placing them on whichever grid their
`sector_number` implies. Adding a location, or repositioning one, is a
seed-data change, not a template change — just watch for overlaps
within the same sector (or the outside grid). There's no player
movement between locations yet, so beyond The Undercroft (everyone's
starting/only reachable location), the map is a browsable reference for
now — travel and the territory-claim flow connecting to it are natural
next steps.

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
- There's no player movement between locations yet (see Map above), so
  "contested" claiming is currently only meaningful at The Undercroft,
  since that's the only place every character can actually be present.
- Quests and full combat encounters are not implemented yet — see the
  phased build plan for what's next.
