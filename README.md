# RAGE QUEUE

**Race to Window 7. Try not to lose your mind in the queue.**

Rage Queue is a browser-based, arcade platforming game set inside a cartoonishly chaotic Durban Home Affairs office. Race through a procedurally generated queue full of suspicious checkpoints, moving traps, bureaucracy, NPC encounters and increasingly questionable shortcuts. Play a solo run or race friends online. Collect rands and stamps, build rage, exploit lucky buffs and survive long enough to reach Window 7.

The game is a standalone HTML5 page (`index.html`) with optional Netlify Functions + Netlify Blobs for the worldwide leaderboards. Multiplayer uses PeerJS/WebRTC; the host's browser acts as the race referee.

## Play modes and rules

- **Solo:** Click **SOLO RUN** or press **Space** on the menu. NPC conversations form part of the story and occur automatically when you approach them; choose your response and attempt the spinner skill check. **Esc** pauses the solo simulation and provides restart, exit and audio settings.
- **Multiplayer:** One player selects **HOST A RACE**, shares the room code, and starts when friends have joined. Other players enter that code under **JOIN**. The host must stay connected. Approaching an `!` NPC is optional: press **I** (or TALK on mobile) to risk a buff or debuff, or run right past without stopping. The others keep racing during your conversation. **Esc** shows settings/leave, but never pauses the shared race.
- **Goal:** Survive the traps and reach Window 7. Real checkpoints save progress; fake stamps, collapsing platforms and other hazards are designed to mislead. Collect rands and stamps to improve your result. The first finisher starts **Last Call** for stragglers.
- **Last Call:** Every racer may add or remove 30 seconds using the clock controls or `[ / ]`; each racer has **three changes total**, with a **10-second cooldown**, enforced by the host. Clock limits still apply. Anyone racing when Last Call expires is DNF.
- **BFG:** A very rare BFG 9000 collectible ends the entire multiplayer race immediately: the finder wins and *all other racers*, including any earlier finishers, are DNF.
- **Rage:** Build rage by suffering. At **70%** you can heckle a rival in multiplayer with **H**. At **100%**, use **Shift / X** for a short invulnerable rage burst that can break the Window 7 gate.
- **From Hell:** Some seeds generate a much harsher Home Affairs From Hell run. Type `HELL` as the seed to find one deliberately. Type `BFG` to find a seed with the rare BFG.

## Keyboard controls

| Key | Action |
| --- | --- |
| `← / →` or `A / D` | Move left / right |
| `Space / W / ↑` | Jump; a brief tap gives a smaller hop |
| `I` | Talk to nearby `!` NPC in multiplayer (optional) |
| `W / S` or `↑ / ↓` | Move the dialogue selection |
| `1 / 2 / 3` | Directly choose an NPC option |
| `Space / Enter` | Confirm NPC choice, continue dialogue, stop spinner |
| `Shift / X` | Rage burst when rage reaches 100% |
| `H` | Heckle another racer once rage reaches 70% |
| `Tab` | Change heckle target |
| `R` | Retry from your last real checkpoint |
| `[` / `]` | Remove / add 30 seconds in multiplayer Last Call (limited uses) |
| `Esc` | Pause solo, or open the race menu, settings and exit controls |
| `M` | Mute / unmute music |
| **`L`** | **Toggle FULL vs LITE background / visual effects**. LITE is a performance mode, not a gameplay change. |

The main menu and the control labels below the game show the essentials. **More controls, traps & multiplayer rules** expands the full reminder without obscuring the daily leaderboard. On phones/tablets, use the on-screen joystick, JUMP, TALK, RAGE, HECKLE and menu buttons. Landscape mode works best.

## Seeds, competition and scores

- A seed determines level layout, traps, pickups and game variations. Reuse it to replay the same generated challenge. Leave the seed field empty for a random run.
- **DAILY** selects the same world seed for a UTC day. The daily menu top five uses only scores for that day's seed and resets at **00:00 UTC** (02:00 in South Africa). The timer and live leaderboard automatically refresh while the menu is visible, with scores polled approximately every 10 seconds.
- **HIGH SCORES** includes WORLD and THIS SEED (shared worldwide through the deployed Netlify backend) plus MINE (stored on the current browser only). The game does not need a separate Firebase or Supabase project.
- Multiplayer leaderboard results are submitted when the host finalizes the round; if the host disconnects beforehand, the pending results may not upload.
- Worldwide scores are not cheat-proof: browser clients can be modified, so the board is intended for game-jam fun rather than prizes.

## Run locally

The project runs entirely in the browser. To start the game on your own computer, open `index.html` in Chrome/Edge. For a more realistic web-server test, open VS Code's terminal **in this directory** (the folder with `index.html` and `package.json`) and run:

```powershell
py -m http.server 8000
```

Then visit `http://localhost:8000`. Stop the server with `Ctrl+C`. The optional `py` launcher requires Python on Windows; `python -m http.server 8000` works on other setups. The multiplayer broker requires an internet connection.

To install backend dependencies and run the included regression checks (requires Node.js/npm):

```powershell
npm install
npm test
```

The tests cover procedural generation, safe portals, piston collisions, daily leaderboards, multiplayer clock limits and BFG ending. The npm build command runs these tests before Netlify publishes the static files and functions.

## Deploy to GitHub and Netlify (recommended for shared scores)

> **Use your existing Netlify site if it already has scores**. Creating a brand-new Netlify site would start a separate leaderboard store. GitHub hosts the source; **Netlify** runs the `/api/scores` backend. Keep the site's address stable.

1. Extract the source ZIP. Open the extracted project folder in VS Code, and open **Terminal → New Terminal**. Check that `index.html`, `package.json` and `netlify.toml` are in the current directory.
2. Create an **empty** GitHub repository, without an auto-generated README or .gitignore (those already exist locally). Then in the VS Code terminal:

   ```powershell
   git init
   git branch -M main
   git add .
   git commit -m "Rage Queue v3.2"
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```

   Replace the remote URL with your actual repo's HTTPS URL. If Git asks for your identity, set `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"` before committing. GitHub may prompt you to sign in in your browser.
3. In Netlify open your **existing** site, go to **Project configuration → Developer settings → Continuous deployment → Repository → Link repository**, then choose the GitHub repository. (For a brand-new Netlify site, use **Add new project → Import an existing project**.)
4. The checked-in `netlify.toml` defines build command `npm run build`, publish directory `.`, and functions directory `netlify/functions`. Trigger the first deploy and wait for it to finish.
5. Verify `https://YOUR-SITE.netlify.app/api/scores?daily=1` responds with JSON containing `rows`, `day`, `seed` and `resetAt`. If it is 404 or errors, check the Netlify deploy and function logs.
6. For subsequent updates, use `git add .`, `git commit -m "Describe change"`, then `git push`; the linked Netlify site redeploys automatically. Refresh old game tabs after deploying a multiplayer protocol change.

**Without GitHub:** Deploy with the Netlify CLI instead: `npm install -g netlify-cli`, `netlify login`, and `netlify deploy --prod` from this same folder, selecting your existing site. Simple Netlify drag-and-drop deployment does not reliably build this function's dependencies.

## Publish the browser game on itch.io

itch.io hosts the game HTML, **not** the Netlify backend. The included helper builds a tiny itch-compatible ZIP with the Netlify address embedded so itch and Netlify players can use the same global leaderboard.

From your extracted source folder, run:

```powershell
py prepare_itch.py https://ragequeue.netlify.app
```

This writes `dist/RageQueue_itch_v3.2.zip`, containing a ready-to-play `index.html` at the ZIP root. If your Netlify URL differs, replace it in the command. The helper does **not** modify your source file.

1. Go to [itch.io → Create new project](https://itch.io/game/new). Choose an **HTML** browser game.
2. Upload **`dist/RageQueue_itch_v3.2.zip`** and mark it for browser play. Do not upload the source-project ZIP as your itch build.
3. Select an embedded frame with sufficient height (start near **1000 × 850 pixels**) or use **click to launch in fullscreen**. Test the start menu, expanded rules, and leaderboard while previewing the page.
4. Publish after testing. When you change game HTML later, **regenerate and replace the itch ZIP separately**; updating the GitHub/Netlify site alone does not modify the itch upload.

Netlify and itch.io players may share a room code because gameplay uses PeerJS, not a leaderboard-hosted match server. The host must remain connected. Some restrictive networks can block WebRTC connections.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Playable HTML5 client and canvas game |
| `netlify/functions/scores.mjs` | Daily/global leaderboard API |
| `netlify.toml`, `package.json` | Netlify build and backend dependencies |
| `prepare_itch.py` | Generates an itch.io browser-game ZIP pointing at your Netlify site |
| `tests/` | Repeatable game and backend regression checks |
| `CHANGELOG.md` | Version-by-version development history |

For version history, fixes and implementation changes, see **[CHANGELOG.md](CHANGELOG.md)**. This README is intentionally focused on the game, how to play, running it and publishing it.
