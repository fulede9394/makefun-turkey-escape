// The world: three stages from farmyard to kitchen, and the one step that
// advances all of it — turkey, farmer, knives, heat, pickups and the exit.
// The layouts are fixed data, so a screenshot seed always stages the same
// farm; only the cosmetic flutter is random.
import {
  CORN_SCORE,
  FEATHER_SCORE,
  FIELD,
  LIFE_BONUS,
  STAGE_CLEAR_SCORE,
  TURKEY,
} from './settings.js';
import { createSeededRandom } from './rng.js';
import { createTurkey, resetTurkey, stepTurkey, turkeyHitByKnife, turkeyOnOven } from './turkey.js';
import { createFarmer, resetFarmer, stepFarmer } from './farmer.js';
import { createKnife, createPickup, knifePoint, stepKnife } from './hazards.js';

export const STAGE_NAMES = ['Farmyard', 'Barn', 'Kitchen'];
export const STAGE_SPEED = [1.0, 1.08, 1.16];

const STAGE_DATA = [
  {
    name: 'Farmyard',
    walls: [
      { x: 120, y: 120, w: 200, h: 18 },
      { x: 640, y: 100, w: 200, h: 18 },
      { x: 120, y: 460, w: 200, h: 18 },
      { x: 640, y: 470, w: 200, h: 18 },
      { x: 450, y: 260, w: 60, h: 140 },
    ],
    bales: [
      { x: 240, y: 300, r: 34 },
      { x: 720, y: 300, r: 34 },
      { x: 480, y: 120, r: 30 },
    ],
    ovens: [],
    knives: [[480, 80, 480, 520, 90, 0.2]],
    corn: [
      [200, 200], [760, 180], [300, 380], [660, 400],
      [480, 540], [120, 300], [840, 300], [480, 60],
    ],
    feather: [880, 540],
    turkeySpawn: { x: 80, y: 520 },
    farmerSpawn: { x: 880, y: 80 },
    waypoints: [
      { x: 880, y: 80 }, { x: 880, y: 520 }, { x: 80, y: 520 }, { x: 80, y: 80 },
    ],
    exit: { x: 920, y: 260, w: 40, h: 80 },
  },
  {
    name: 'Barn',
    walls: [
      { x: 0, y: 280, w: 220, h: 18 },
      { x: 740, y: 280, w: 220, h: 18 },
      { x: 300, y: 120, w: 18, h: 200 },
      { x: 640, y: 300, w: 18, h: 200 },
      { x: 380, y: 420, w: 220, h: 18 },
    ],
    bales: [
      { x: 200, y: 140, r: 32 },
      { x: 760, y: 460, r: 32 },
      { x: 480, y: 520, r: 30 },
      { x: 480, y: 80, r: 28 },
    ],
    ovens: [],
    knives: [
      [100, 200, 860, 200, 110, 0],
      [700, 60, 700, 540, 100, 0.5],
    ],
    corn: [
      [150, 150], [810, 150], [480, 200], [250, 480], [700, 480],
      [480, 330], [100, 520], [860, 520], [480, 60],
    ],
    feather: [480, 540],
    turkeySpawn: { x: 60, y: 60 },
    farmerSpawn: { x: 900, y: 540 },
    waypoints: [
      { x: 900, y: 540 }, { x: 900, y: 60 }, { x: 60, y: 60 }, { x: 60, y: 540 },
    ],
    exit: { x: 920, y: 120, w: 40, h: 80 },
  },
  {
    name: 'Kitchen',
    walls: [
      { x: 80, y: 80, w: 260, h: 26 },
      { x: 620, y: 80, w: 260, h: 26 },
      { x: 80, y: 480, w: 260, h: 26 },
      { x: 620, y: 480, w: 260, h: 26 },
      { x: 430, y: 240, w: 100, h: 26 },
      { x: 430, y: 340, w: 100, h: 26 },
    ],
    bales: [{ x: 480, y: 300, r: 30 }],
    ovens: [
      { x: 360, y: 40, w: 120, h: 60 },
      { x: 480, y: 500, w: 120, h: 60 },
    ],
    knives: [
      [60, 160, 900, 160, 130, 0],
      [60, 440, 900, 440, 120, 0.5],
      [480, 120, 480, 480, 110, 0.25],
    ],
    corn: [
      [150, 300], [810, 300], [480, 150], [480, 450],
      [250, 150], [700, 450], [250, 450], [700, 150],
    ],
    feather: [60, 540],
    turkeySpawn: { x: 60, y: 300 },
    farmerSpawn: { x: 900, y: 80 },
    waypoints: [
      { x: 900, y: 80 }, { x: 900, y: 520 }, { x: 60, y: 520 }, { x: 60, y: 80 },
    ],
    exit: { x: 440, y: 0, w: 80, h: 24 },
  },
];

/** A fresh world at stage 0, score and lives reset. */
export function createWorld(seed) {
  const world = {
    seed,
    random: createSeededRandom(seed),
    stage: 0,
    scoreFloat: 0,
    distance: 0,
    lives: TURKEY.lives,
    time: 0,
    over: null,
    turkey: null,
    farmer: null,
    walls: [],
    bales: [],
    ovens: [],
    knives: [],
    corn: [],
    feather: null,
    exit: null,
    turkeySpawn: null,
    farmerSpawn: null,
    particles: [],
    pops: [],
  };
  buildStage(world, 0);
  return world;
}

/** Load one stage's layout, keeping score, lives and distance. */
export function buildStage(world, index) {
  const data = STAGE_DATA[index];
  world.stage = index;
  world.walls = data.walls.map((wall) => ({ ...wall }));
  world.bales = data.bales.map((bale) => ({ ...bale }));
  world.ovens = data.ovens.map((oven) => ({ ...oven }));
  world.knives = data.knives.map((line) => createKnife(line[0], line[1], line[2], line[3], line[4], line[5]));
  world.corn = data.corn.map((point) => createPickup(point[0], point[1], false));
  world.feather = createPickup(data.feather[0], data.feather[1], true);
  world.exit = { ...data.exit };
  world.turkeySpawn = { ...data.turkeySpawn };
  world.farmerSpawn = { ...data.farmerSpawn };
  world.turkey = createTurkey(data.turkeySpawn);
  world.farmer = createFarmer(data.farmerSpawn, data.waypoints);
  world.particles = [];
  world.pops = [];
}

export function resetWorld(world) {
  world.scoreFloat = 0;
  world.distance = 0;
  world.lives = TURKEY.lives;
  world.time = 0;
  world.over = null;
  buildStage(world, 0);
}

/** The score the HUD shows: distance and pickups, rounded down. */
export function worldScore(world) {
  return Math.floor(world.scoreFloat);
}

function burstFeathers(world, x, y, count) {
  for (let index = 0; index < count; index += 1) {
    const angle = world.random() * Math.PI * 2;
    const speed = 40 + world.random() * 90;
    world.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      t: 0,
      life: 0.6 + world.random() * 0.4,
    });
  }
}

function addPop(world, x, y, text) {
  world.pops.push({ x, y, text, t: 0, life: 1.1 });
}

function loseLife(world, cause) {
  world.lives -= 1;
  burstFeathers(world, world.turkey.x, world.turkey.y, 14);
  addPop(world, world.turkey.x, world.turkey.y - 26, cause === 'burn' ? 'TOO HOT!' : 'OUCH!');
  resetTurkey(world.turkey, world.turkeySpawn);
  resetFarmer(world.farmer, world.farmerSpawn);
  if (world.lives <= 0) {
    world.over = 'caught';
    return 'lose';
  }
  return 'hit';
}

function clearStage(world) {
  world.scoreFloat += STAGE_CLEAR_SCORE + world.lives * LIFE_BONUS;
  if (world.stage >= STAGE_DATA.length - 1) {
    world.over = 'escaped';
    return 'win';
  }
  buildStage(world, world.stage + 1);
  addPop(world, world.turkey.x, world.turkey.y - 26, `STAGE ${world.stage + 1}!`);
  return 'clear';
}

/**
 * Advance the world one fixed step. Returns the events of this step
 * ('spotted', 'lost', 'pickup', 'feather', 'hit', 'lose', 'clear', 'win')
 * so the boot loop can play the matching sound.
 */
export function stepWorld(world, direction, dashWanted, dt) {
  const events = [];
  if (world.over) return events;
  world.time += dt;
  const turkey = world.turkey;
  const beforeX = turkey.x;
  const beforeY = turkey.y;

  const dashed = stepTurkey(turkey, direction, dashWanted, world.walls, world.bales, dt);
  if (dashed) {
    burstFeathers(world, turkey.x, turkey.y, 5);
    addPop(world, turkey.x, turkey.y - 26, 'GOBBLE!');
  }
  const moved = Math.hypot(turkey.x - beforeX, turkey.y - beforeY);
  world.distance += moved;
  world.scoreFloat += moved * 0.02;

  const farmerEvent = stepFarmer(world.farmer, turkey, world.walls, dt, STAGE_SPEED[world.stage]);
  if (farmerEvent) events.push(farmerEvent);

  // Knives patrol, and one touch costs a life.
  for (const knife of world.knives) {
    const point = stepKnife(knife, dt);
    if (turkey.invulnerable <= 0 && turkeyHitByKnife(turkey, point)) {
      events.push(loseLife(world, 'knife'));
      if (world.over) break;
    }
  }
  if (world.over) return events;

  // The farmer's grab costs a life too.
  const farmer = world.farmer;
  const catchGap = Math.hypot(turkey.x - farmer.x, turkey.y - farmer.y);
  if (turkey.invulnerable <= 0 && catchGap < TURKEY.catchRadius + 14) {
    events.push(loseLife(world, 'caught'));
    if (world.over) return events;
  }

  // Ovens build heat; a full meter burns a life.
  if (turkeyOnOven(turkey, world.ovens)) {
    turkey.heat += dt / TURKEY.heatToBurn;
    if (turkey.heat >= 1) {
      turkey.heat = 0;
      events.push(loseLife(world, 'burn'));
      if (world.over) return events;
    }
  } else if (turkey.heat > 0) {
    turkey.heat = Math.max(0, turkey.heat - dt / TURKEY.heatCool);
  }

  // Corn and the golden feather.
  for (const cob of world.corn) {
    if (!cob.taken && Math.hypot(turkey.x - cob.x, turkey.y - cob.y) < 26) {
      cob.taken = true;
      world.scoreFloat += CORN_SCORE;
      addPop(world, cob.x, cob.y - 18, `+${CORN_SCORE}`);
      events.push('pickup');
    }
  }
  const feather = world.feather;
  if (feather && !feather.taken && Math.hypot(turkey.x - feather.x, turkey.y - feather.y) < 26) {
    feather.taken = true;
    world.scoreFloat += FEATHER_SCORE;
    addPop(world, feather.x, feather.y - 18, `+${FEATHER_SCORE}`);
    events.push('feather');
  }

  // The exit gate ends the stage — or the whole escape.
  const exit = world.exit;
  if (
    turkey.x > exit.x && turkey.x < exit.x + exit.w &&
    turkey.y > exit.y && turkey.y < exit.y + exit.h
  ) {
    events.push(clearStage(world));
    if (world.over) return events;
  }

  // Fade the feathers and the floating words.
  for (const particle of world.particles) {
    particle.t += dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 160 * dt;
  }
  world.particles = world.particles.filter((particle) => particle.t < particle.life);
  for (const pop of world.pops) {
    pop.t += dt;
    pop.y -= 26 * dt;
  }
  world.pops = world.pops.filter((pop) => pop.t < pop.life);
  return events;
}

/** The stage name the HUD shows. */
export function stageName(world) {
  return STAGE_NAMES[world.stage];
}

/** Metres the turkey has run, for the HUD. */
export function distanceMetres(world) {
  return Math.floor(world.distance / 40);
}
