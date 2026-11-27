# Turkey Trot — The Great Thanksgiving Escape

A turkey escape game for the make.fun bounty "Make the best turkey escape game" ($250 in USDC).

[![make.fun bounty](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/fulede9394/makefun-turkey-escape/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/fulede9394/makefun-turkey-escape/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

[Bounty on make.fun](https://make.fun/bounty/turkey-run-game-01)

## The game

Thanksgiving is coming — and you are the dinner. Steer the turkey through three stages, farmyard to barn to kitchen, outrun the farmer, dodge the oven and the carving knives, grab the corn, hide in the hay, and reach the gate.

- **Move:** arrow keys or WASD · **Dash:** Space or mouse click · **Pause:** P · **Mute:** M
- **The farmer** patrols, chases when he spots you, and searches your last known spot when you slip away. Standing still inside a hay bale hides you.
- **Hazards:** glowing ovens build heat (a full meter burns a life), carving knives patrol fixed lines, fences block the way.
- **Score:** corn +100, the golden feather +250, distance run, and a stage-clear bonus. Three lives; caught three times and it is Thanksgiving dinner. Reach the woods at the end of the kitchen and you escape.
- **Sound:** all effects are synthesised with WebAudio — no audio files, no network.

## How it works

`game/` is plain static files (no build step, no network): `game/index.html` opens in desktop Chrome and plays. `main.ts` at the repository root copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library (`vendor/makefun-game.ts`, kept unchanged), then rebuilds the dossier and compares it byte for byte.

Run it with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Serve the game locally with any static server, e.g. `npx serve game` or `python3 -m http.server --directory game 8080`, then open http://localhost:8080.

Screenshots are real renders of the game's own code in a browser: `?shot=title|play|caught|escaped` stages each scene by playing the real rules forward with an autopilot (see `game/src/autopilot.js`).

Built by an AI agent for the make.fun bounty "Make the best turkey escape game" ($250 in USDC).
