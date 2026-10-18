# Rage Queue changelog

## v3.2 — 18 October 2026

- Restructured the start menu so the DAILY WORLD TOP 5 remains in the left column, game-start and join controls remain in the right column, and the always-visible control legend is a separate full-width footer **below both columns**, with no overlap or clipped controls. Five-item daily scores remain visible without a nested scroll area at tested desktop resolution; narrow screens scroll the whole overlay.
- Added the **L** key to the start-menu controls, expanded rules, and the control labels beneath the game. L switches FULL/LITE background and visual effects; M still mutes music.
- Replaced the version-by-version release notes in README with an actual player and deployment guide, preserved historical changes here, and consolidated DEPLOYMENT.md into README.
- Updated the itch packager output to `RageQueue_itch_v3.2.zip`, version labels, npm metadata and menu-documentation assertions. Added a `.gitignore` for generated output and dependencies.


## v3.1 — 18 October 2026

- Restored compact, always-visible movement/jump/interaction/choice/rage/Escape key hints inside the main menu and an expandable full control reference, without taking space from the daily top-five panel.
- Poll the daily world and open full leaderboard about every 10 seconds, check again on tab focus/visibility return, and update the UTC daily reset counter once per second.
- BFG pickup now causes the host to immediately declare one winner and mark **everybody else DNF**, including earlier finishers. The server stops the Last Call clock, cancels the earlier winner credit, rejects late finishes and pushes the ending to every player.
- Defer multiplayer score posting until the authoritative round ends: a later BFG prevents defeated players from retaining earlier records from that race. Solo scores remain instant.
- Every racer can use ±30 seconds on Last Call using the on-track widget or keyboard brackets; finishers also have spectator controls. Host enforces **three uses total and 10 seconds between uses per player per round**, plus the old clock floor and cap.
- Added `tests/multiplayer.cjs` with multi-client messaging tests, and updated release guidance and itch packager naming to v3.1.


## v3.0 — 18 October 2026

- Replaced main-menu all-time leaderboard with server-filtered **DAILY WORLD TOP 5**, showing today's UTC date, shared six-character seed, and countdown until 00:00 UTC. Score submissions only enter the daily list if they match the current server-calculated seed; the server uses separate date-keyed storage for automatic daily resets.
- Refitted start menu by hiding the redundant full controls legend, simplifying the NPC description accurately for solo/multiplayer and keeping all five daily score rows visible. Small screens can scroll the entire overlay.
- REJECTED piston only deals damage when descending into the player's head directly underneath, not by side contact or touching an already-lowered piston.
- Portal generator now reserves a real safe floor lane after each exit, preventing stamps (including lethal fakes) and traps from being generated immediately on the other side.
- Added daily UTC reset API route (`GET /api/scores?daily=1`), fully static itch.io packaging helper `prepare_itch.py`, and README deployment section explaining Netlify CLI (no GitHub required) or optional GitHub deployment.
- Automated 1000-seed check: 576 portals all with a safe clearance. Tested 240 deterministic coin layouts, piston contact directions, Netlify daily reset at midnight, other-seed exclusion, CORS, and checked the five-entry menu on five viewport sizes.

## v2.9 — 18 October 2026

- World leaderboard ready for itch.io: CORS headers and an `OPTIONS` preflight handler in
  `scores.mjs`; the game calls `NETLIFY_SITE/api/scores` when it isn't served from Netlify.
- NPC dialogue input: new confirm key (Space / Enter / tap). W and ↑ only move the highlight and
  never confirm; S and ↓ move down; 1 2 3 still pick directly. Applies to talk, choose, spinner
  and result stages in both modes. Fixes v2.8's W/↑ moving and confirming in the same keypress.
- Kept the separate solo panel and multiplayer strip layouts; both now show the same key hints.
- Main menu "Rules of this queue" lists I, W S / 1 2 3, Space / Enter, Shift / X, H, Tab, R and Esc.
- Last-call clock: only the race winner can add or take away time (enforced by the host). Others
  see who controls it. Control passes to the earliest remaining finisher if the winner leaves.
- Lobby invite link points to the Netlify site when the game is running on itch.io.
- Tests: confirm-key, winner-only clock and CORS checks added to `npm test`. Browser-checked
  solo and multiplayer choices, a three-player clock race and the menu at several sizes.

## v2.8 — 18 October 2026

- Replaced clipped start-screen scrolling with a responsive, two-column desktop menu and a
  viewport-scrolling single-column layout on smaller screens.
- Added Esc menu with true solo pause, restart on the same seed, exit to main menu,
  music volume and sound-effect volume. The same settings are accessible before starting.
  Audio preferences persist in localStorage. Touch devices have a menu button.
- Multiplayer menus do **not** freeze the world, the clock or other competitors. Leaving
  a race disconnects from the room. Esc also works on lobby/results/highscore panels.
- Normal mode now has denser traps, additional saws/rollers, harder fake platforms and
  brittle planks, slightly wider spikes and pits, and added deceptive checkpoints.
  Hell mode retains its stronger difficulty profile.
- Preserved v2.7 reachable coins, NPC opt-in dialogue, multiplayer spectator and gameplay.
- 240-seed coin/NPC regression, 1000-seed difficulty audit, and browser checks at five
  viewport sizes. All documented browser scenarios passed; internet-hosted multi-device
  and serverless deployment remain to be tested on the actual Netlify site.
- Added explicit `npm run build` to run regressions before a Git-connected Netlify deployment.



## v2.7 — 18 October 2026

**Base:** v2.6 HTML, Netlify configuration, Netlify Blobs leaderboard and multiplayer infrastructure.

### Fixed
- Spectator camera draws the *full seeded environment* rather than a stripped-down hazards-only view. It follows the selected active racer, with all regular parallax scenery, platforms, NPCs, signs, collectibles, pickups, portals and hazards.
- Spectating now uses an independently generated level and receives compact remote-state updates so a completed player's collected items and world changes do not corrupt the watched scene.
- Corrected inaccessible procedural coins with a deterministic trajectory-based pass using normal jump physics plus shelves, springs, trampolines and safe takeoff/landing points.
- Spectator trampoline animation uses its own frame clock instead of the finished player's frame counter.

### Added / restored
- Optional multiplayer NPC interaction: press **I** or touch **TALK** at an exclamation-mark NPC. Players may simply run past without side effects.
- The restored multiplayer choices have their introduction text, all three choices, the existing spinner/dice risk-reward outcomes and an outcome dialogue strip.
- Interacting stops only the interacting player. Other players and the global countdown continue. The final Window 7 conversation remains compulsory.
- Compact collection, NPC, gate and hazard state syncing for spectator views.
- Repeatable command-line regression checks: `npm test` (240 procedural seeds and dialogue logic).

### Preserved
- Static browser `index.html`, solo dialogue, co-op race networking over PeerJS/WebRTC / BroadcastChannel, game scoring, Netlify Functions, v2.6 jetpack, teleporter, trampoline and turbo-pad behavior.

### Verification / limits
- 240 tested seeds, 19,188 coins, 929 placements corrected, zero failing the reachability heuristic.
- Two-player Chromium smoke test: joined race, skipped NPC, interacted, selected a choice, ran spinner, finished race and spectated the remaining player; no tested JavaScript exceptions.
- It remains worth playtesting long races and hostile real networks before submission. Reachability is based on an explicit launch/flight model and does not claim that arbitrary routes or every hazard combination can be completed automatically.
