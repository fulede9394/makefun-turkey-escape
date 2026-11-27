// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between five screens:
// title, play, paused, caught and escaped.
//
// ?seed=N fixes the world. ?shot=title|play|caught|escaped (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './settings.js';
import { createWorld, resetWorld, stepWorld, worldScore } from './levels.js';
import {
  ACTION_CONFIRM,
  ACTION_MUTE,
  ACTION_PAUSE,
  createInput,
} from './input.js';
import { createSound } from './sound.js';
import {
  SCREEN_CAUGHT,
  SCREEN_ESCAPED,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  createRenderer,
} from './paint.js';
import { stageShot } from './autopilot.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(seed);
const renderer = createRenderer(canvas);
const sound = createSound();
const input = createInput(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score lasts one visit.
  }
}

function playEvents(events) {
  for (const event of events) {
    if (event === 'pickup' || event === 'feather') sound.pickup();
    else if (event === 'spotted') sound.alarm();
    else if (event === 'hit') sound.thud();
    else if (event === 'win' || event === 'clear') sound.win();
    else if (event === 'lose') sound.lose();
  }
}

function announce(text) {
  status.textContent = text;
}

function runShot(name) {
  sound.setEnabled(false);
  const scene = stageShot(name, world, stepWorld);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function setScreen(next) {
    screen = next;
    if (next === SCREEN_TITLE) announce('Turkey Trot title screen. Press Enter to start.');
    else if (next === SCREEN_CAUGHT) announce(`Caught! Score ${worldScore(world)}. Press Enter to try again.`);
    else if (next === SCREEN_ESCAPED) announce(`Escaped! Score ${worldScore(world)}. Press Enter to play again.`);
    else if (next === SCREEN_PAUSED) announce('Paused. Press P to resume.');
    else announce('Playing. Dodge the farmer, the oven and the knives.');
  }

  function startRun() {
    resetWorld(world);
    setScreen(SCREEN_PLAY);
  }

  function frame(now) {
    const elapsed = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    for (const action of input.takeActions()) {
      if (action === ACTION_CONFIRM) {
        sound.setEnabled(true);
        if (screen === SCREEN_TITLE || screen === SCREEN_CAUGHT || screen === SCREEN_ESCAPED) {
          startRun();
        }
      } else if (action === ACTION_PAUSE) {
        if (screen === SCREEN_PLAY) setScreen(SCREEN_PAUSED);
        else if (screen === SCREEN_PAUSED) setScreen(SCREEN_PLAY);
      } else if (action === ACTION_MUTE) {
        sound.toggleMute();
      }
    }
    if (screen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        const direction = input.direction();
        const events = stepWorld(world, direction, input.takeDash(), STEP);
        playEvents(events);
        if (world.over === 'caught') {
          if (worldScore(world) > best) {
            best = worldScore(world);
            saveBest(best);
          }
          setScreen(SCREEN_CAUGHT);
          break;
        }
        if (world.over === 'escaped') {
          if (worldScore(world) > best) {
            best = worldScore(world);
            saveBest(best);
          }
          setScreen(SCREEN_ESCAPED);
          break;
        }
      }
    }
    renderer.draw(world, screen, best);
    requestAnimationFrame(frame);
  }

  setScreen(SCREEN_TITLE);
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
