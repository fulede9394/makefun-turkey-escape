// The turkey: a waddling escape artist. Walks on keys, dashes on Space or
// a click (a short burst that sheds feathers), hides when it stands still
// inside a hay bale, and builds up heat when it lingers on an oven.
import { FIELD, TURKEY } from './settings.js';
import { circleHitsWalls, clamp, slideMove } from './geometry.js';

export function createTurkey(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    face: 1,
    moving: false,
    dashTime: 0,
    dashCooldown: 0,
    dashX: 1,
    dashY: 0,
    invulnerable: 0,
    heat: 0,
    hidden: false,
    bob: 0,
  };
}

/**
 * Advance the turkey one step. Returns 'dashed' when a dash started, so the
 * world can puff feathers and the sound can gobble.
 */
export function stepTurkey(turkey, direction, dashWanted, walls, bales, dt) {
  const speed = TURKEY.walk;
  let dashed = false;
  if (turkey.dashCooldown > 0) turkey.dashCooldown -= dt;
  if (turkey.invulnerable > 0) turkey.invulnerable -= dt;

  // A dash bursts in the direction the turkey is already moving (or facing).
  if (dashWanted && turkey.dashCooldown <= 0 && turkey.dashTime <= 0) {
    turkey.dashTime = TURKEY.dashTime;
    turkey.dashCooldown = TURKEY.dashCooldown;
    turkey.dashX = direction.x !== 0 || direction.y !== 0 ? direction.x : turkey.face;
    turkey.dashY = direction.y;
    dashed = true;
  }

  let moveX;
  let moveY;
  if (turkey.dashTime > 0) {
    turkey.dashTime -= dt;
    moveX = turkey.dashX * TURKEY.dashSpeed * dt;
    moveY = turkey.dashY * TURKEY.dashSpeed * dt;
  } else {
    moveX = direction.x * speed * dt;
    moveY = direction.y * speed * dt;
  }
  const moved = slideMove(turkey.x, turkey.y, TURKEY.radius, moveX, moveY, walls);
  turkey.x = clamp(moved.x, TURKEY.radius, FIELD.width - TURKEY.radius);
  turkey.y = clamp(moved.y, TURKEY.radius, FIELD.height - TURKEY.radius);
  turkey.moving = moveX !== 0 || moveY !== 0;
  if (direction.x !== 0) turkey.face = direction.x > 0 ? 1 : -1;
  turkey.vx = moveX / dt;
  turkey.vy = moveY / dt;
  if (turkey.moving) turkey.bob += dt * 11;
  else turkey.bob = 0;

  // Standing still inside a hay bale hides the turkey from the farmer.
  const slow = Math.hypot(turkey.vx, turkey.vy) < 60;
  turkey.hidden = slow && bales.some((bale) => Math.hypot(turkey.x - bale.x, turkey.y - bale.y) < bale.r + 4);
  return dashed;
}

/** True when the turkey is standing on an oven rect (heat builds). */
export function turkeyOnOven(turkey, ovens) {
  for (const oven of ovens) {
    if (
      turkey.x > oven.x - 4 && turkey.x < oven.x + oven.w + 4 &&
      turkey.y > oven.y - 4 && turkey.y < oven.y + oven.h + 4
    ) {
      return true;
    }
  }
  return false;
}

/** True when the turkey overlaps a knife's current point. */
export function turkeyHitByKnife(turkey, knifePoint) {
  const dx = turkey.x - knifePoint.x;
  const dy = turkey.y - knifePoint.y;
  const reach = TURKEY.radius + 12;
  return dx * dx + dy * dy < reach * reach;
}

/** True when the turkey is free to be caught (not flashing invulnerable). */
export function turkeyCatchable(turkey) {
  return turkey.invulnerable <= 0;
}

/** Put the turkey back at its spawn after a hit, briefly untouchable. */
export function resetTurkey(turkey, spawn) {
  turkey.x = spawn.x;
  turkey.y = spawn.y;
  turkey.vx = 0;
  turkey.vy = 0;
  turkey.dashTime = 0;
  turkey.dashCooldown = 0;
  turkey.invulnerable = TURKEY.invulnerable;
  turkey.heat = 0;
  turkey.hidden = false;
}

/** True when the turkey's circle overlaps a wall (used by the autopilot). */
export function turkeyBlockedAt(x, y, walls) {
  return circleHitsWalls(x, y, TURKEY.radius, walls);
}
