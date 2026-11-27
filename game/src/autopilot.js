// The screenshot autopilot: it plays the real rules forward from a fresh
// world for a fixed number of steps, so each ?shot= scene is what a short
// game really looks like — never a posed mock-up. The same seed always
// stages the same frame.
//
// Scenes: title (the farm at rest), play (a chase in full flight), caught
// (a hurried turkey walks into the farmer), escaped (the last dash for the
// woods). The play pilot steers toward corn and away from the farmer,
// knives and ovens; the caught pilot barely looks ahead, as a hurried
// player does.
import { FIELD, STEP, TURKEY } from './settings.js';
import { buildStage, resetWorld } from './levels.js';
import { circleHitsWalls } from './geometry.js';
import { SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PLAY, SCREEN_TITLE } from './paint.js';

const SAMPLE = 1 / 30;
const CANDIDATES = [
  [0, -1], [1, -1], [1, 0], [1, 1],
  [0, 1], [-1, 1], [-1, 0], [-1, -1],
  [0, 0],
];

/** Where the turkey wants to go right now: the exit, or the nearest corn. */
function goalOf(world, goal) {
  if (goal === 'exit') return { x: world.exit.x + world.exit.w / 2, y: world.exit.y + world.exit.h / 2 };
  let best = null;
  let bestDistance = Infinity;
  for (const cob of world.corn) {
    if (cob.taken) continue;
    const d = Math.hypot(cob.x - world.turkey.x, cob.y - world.turkey.y);
    if (d < bestDistance) {
      bestDistance = d;
      best = cob;
    }
  }
  if (best) return { x: best.x, y: best.y };
  return { x: world.exit.x + world.exit.w / 2, y: world.exit.y + world.exit.h / 2 };
}

/** Score one candidate direction: progress to the goal, minus the danger. */
function scoreDirection(world, direction, goal, horizon) {
  const turkey = world.turkey;
  const target = goalOf(world, goal);
  const toGoalX = target.x - turkey.x;
  const toGoalY = target.y - turkey.y;
  const goalLength = Math.hypot(toGoalX, toGoalY) || 1;
  let score = (direction[0] * toGoalX + direction[1] * toGoalY) / goalLength;

  // A step that runs into a wall is worthless.
  const stepX = turkey.x + direction[0] * TURKEY.walk * horizon;
  const stepY = turkey.y + direction[1] * TURKEY.walk * horizon;
  if (circleHitsWalls(stepX, stepY, TURKEY.radius, world.walls)) score -= 5;
  if (stepX < 40 || stepX > FIELD.width - 40 || stepY < 40 || stepY > FIELD.height - 40) score -= 1;

  // Keep clear of the farmer: running toward him is bad, running away good.
  const farmerGap = Math.hypot(world.farmer.x - turkey.x, world.farmer.y - turkey.y);
  const awayX = turkey.x - world.farmer.x;
  const awayY = turkey.y - world.farmer.y;
  const awayLength = Math.hypot(awayX, awayY) || 1;
  const awayness = (direction[0] * awayX + direction[1] * awayY) / awayLength;
  if (farmerGap < 170) score += awayness * (1.6 - farmerGap / 170);
  if (farmerGap < 55) score -= 2;

  // Keep clear of the knives' near future positions.
  for (const knife of world.knives) {
    const future = knife.t + (knife.forward ? 1 : -1) * ((knife.speed * horizon) / Math.max(Math.hypot(knife.x2 - knife.x1, knife.y2 - knife.y1), 1));
    const clamped = Math.max(0, Math.min(1, future));
    const kx = knife.x1 + (knife.x2 - knife.x1) * clamped;
    const ky = knife.y1 + (knife.y2 - knife.y1) * clamped;
    const gap = Math.hypot(kx - stepX, ky - stepY);
    if (gap < 70) score -= (70 - gap) / 30;
  }

  // Keep clear of the ovens' glow.
  for (const oven of world.ovens) {
    if (stepX > oven.x - 30 && stepX < oven.x + oven.w + 30 && stepY > oven.y - 30 && stepY < oven.y + oven.h + 30) {
      score -= 1.2;
    }
  }
  return score;
}

function pickMove(world, goal, horizon, reckless) {
  if (reckless) {
    // A hurried turkey walks toward the farmer: it gets caught, on purpose.
    const dx = world.farmer.x - world.turkey.x;
    const dy = world.farmer.y - world.turkey.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length, dash: false };
  }
  let best = CANDIDATES[0];
  let bestScore = -Infinity;
  for (const candidate of CANDIDATES) {
    const length = Math.hypot(candidate[0], candidate[1]) || 1;
    const score = scoreDirection(world, [candidate[0] / length, candidate[1] / length], goal, horizon);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  const length = Math.hypot(best[0], best[1]) || 1;
  const farmerGap = Math.hypot(world.farmer.x - world.turkey.x, world.farmer.y - world.turkey.y);
  return {
    x: best[0] / length,
    y: best[1] / length,
    dash: farmerGap < 75 && world.turkey.dashCooldown <= 0,
  };
}

/** Play the world forward with the autopilot for `seconds` of game time. */
function runAutopilot(world, seconds, options) {
  const steps = Math.floor(seconds / STEP);
  for (let index = 0; index < steps; index += 1) {
    if (world.over) break;
    const move = pickMove(world, options.goal, options.horizon, options.reckless);
    // The step function lives in levels.js; import it lazily to keep this
    // module free of a circular import at load time.
    options.step(world, move, move.dash, STEP);
  }
}

/**
 * Stage one screenshot scene on a fresh world and say which screen to draw
 * over it. `step` is levels.stepWorld, passed in to avoid a cycle.
 */
export function stageShot(name, world, step) {
  resetWorld(world);
  if (name === 'play') {
    runAutopilot(world, 20, { goal: 'corn', horizon: 0.7, reckless: false, step });
    return { screen: world.over === 'caught' ? SCREEN_CAUGHT : SCREEN_PLAY, best: Math.floor(world.scoreFloat) };
  }
  if (name === 'caught') {
    // The farmer starts on top of the turkey; a hurried pilot walks into him.
    world.farmer.x = world.turkey.x + 90;
    world.farmer.y = world.turkey.y - 30;
    runAutopilot(world, 40, { goal: 'corn', horizon: 0.12, reckless: true, step });
    return { screen: world.over === 'caught' ? SCREEN_CAUGHT : SCREEN_PLAY, best: Math.floor(world.scoreFloat) };
  }
  if (name === 'escaped') {
    // The last dash for the woods: stage 3, the turkey near the back door.
    buildStage(world, 2);
    world.turkey.x = 480;
    world.turkey.y = 120;
    world.farmer.x = 880;
    world.farmer.y = 520;
    runAutopilot(world, 30, { goal: 'exit', horizon: 0.7, reckless: false, step });
    return { screen: world.over === 'escaped' ? SCREEN_ESCAPED : SCREEN_PLAY, best: Math.floor(world.scoreFloat) };
  }
  // Title: the farm at rest, a few idle steps so the knives are mid-patrol.
  for (let index = 0; index < 2 / STEP; index += 1) {
    step(world, { x: 0, y: 0 }, false, STEP);
    if (world.over) break;
  }
  return { screen: SCREEN_TITLE, best: 0 };
}
