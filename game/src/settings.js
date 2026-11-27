// Tuning and palette for Turkey Trot. One place holds every number the game
// balances on, so a tweak here retunes the whole escape.
export const FIELD = Object.freeze({ width: 960, height: 600 });
export const STEP = 1 / 60;
export const BEST_KEY = 'turkey-trot-best';

export const TURKEY = Object.freeze({
  radius: 16,
  walk: 172,
  dashSpeed: 440,
  dashTime: 0.16,
  dashCooldown: 1.1,
  lives: 3,
  invulnerable: 2.0,
  heatToBurn: 1.5,
  heatCool: 1.0,
  catchRadius: 30,
});

export const FARMER = Object.freeze({
  radius: 20,
  sight: 235,
  patrolSpeed: 96,
  chaseSpeed: 186,
  searchSpeed: 122,
  loseSightAfter: 1.2,
  searchTime: 2.2,
  patrolWait: 0.9,
});

export const KNIFE = Object.freeze({ radius: 12 });
export const CORN_SCORE = 100;
export const FEATHER_SCORE = 250;
export const STAGE_CLEAR_SCORE = 500;
export const LIFE_BONUS = 100;

// Autumn palette: warm farmyard, barn wood, kitchen tile.
export const PALETTE = Object.freeze({
  grass: '#7fae4c',
  grassDark: '#6f9c40',
  dirt: '#b98a4e',
  barnFloor: '#a97c50',
  barnLine: '#96683f',
  tileA: '#f2e6c9',
  tileB: '#d98a7a',
  fence: '#7a4a21',
  fenceTop: '#96603a',
  counter: '#8d8578',
  counterTop: '#b5aa97',
  hay: '#e0b64f',
  hayDark: '#c79a35',
  turkeyBody: '#8a5a2b',
  turkeyWing: '#6f4520',
  turkeyTail: '#a06a35',
  turkeyHead: '#c98a4b',
  beak: '#e8912d',
  wattle: '#c0392b',
  farmerShirt: '#b03a2e',
  farmerOveralls: '#2e5a88',
  farmerHat: '#d9b23c',
  farmerSkin: '#e8b88a',
  knifeBlade: '#d7dee8',
  knifeHandle: '#5b3a1e',
  ovenBody: '#3a3a3f',
  ovenGlow: '#ff7a1a',
  corn: '#f2c230',
  cornHusk: '#5d8a3c',
  feather: '#f5efe0',
  exitGlow: '#7fd069',
  hud: '#fff7e0',
  danger: '#e23b2e',
});
