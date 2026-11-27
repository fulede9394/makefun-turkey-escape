// The farmer: a patient hunter with four moods. He patrols the farm on a
// loop, chases the turkey the moment he sees it, searches its last known
// spot when it slips away, and corners it when he can.
import { FARMER } from './settings.js';
import { distance, sightBlocked, slideMove } from './geometry.js';

export const FARMER_PATROL = 'patrol';
export const FARMER_CHASE = 'chase';
export const FARMER_SEARCH = 'search';

export function createFarmer(spawn, waypoints) {
  return {
    x: spawn.x,
    y: spawn.y,
    state: FARMER_PATROL,
    waypoint: 0,
    waypoints,
    wait: 0,
    lastSeenX: spawn.x,
    lastSeenY: spawn.y,
    unseenFor: 0,
    searchFor: 0,
    bob: 0,
  };
}

/** Can the farmer see the turkey right now? Walls block sight; hiding does. */
export function farmerSeesTurkey(farmer, turkey, walls) {
  if (turkey.hidden) return false;
  if (distance(farmer.x, farmer.y, turkey.x, turkey.y) > FARMER.sight) return false;
  return !sightBlocked(farmer.x, farmer.y, turkey.x, turkey.y, walls);
}

/**
 * Advance the farmer one step. Returns 'spotted' the first step he sees the
 * turkey, 'lost' when a chase gives up, so the world can sound the alarm.
 */
export function stepFarmer(farmer, turkey, walls, dt, stageSpeed) {
  const patrol = FARMER.patrolSpeed * stageSpeed;
  const chase = FARMER.chaseSpeed * stageSpeed;
  const search = FARMER.searchSpeed * stageSpeed;
  let event = null;

  const sees = farmerSeesTurkey(farmer, turkey, walls);
  if (sees) {
    farmer.lastSeenX = turkey.x;
    farmer.lastSeenY = turkey.y;
    farmer.unseenFor = 0;
    if (farmer.state !== FARMER_CHASE) {
      farmer.state = FARMER_CHASE;
      event = 'spotted';
    }
  } else if (farmer.state === FARMER_CHASE) {
    farmer.unseenFor += dt;
    if (farmer.unseenFor > FARMER.loseSightAfter) {
      farmer.state = FARMER_SEARCH;
      farmer.searchFor = FARMER.searchTime;
      event = 'lost';
    }
  }

  let speed = patrol;
  let targetX = farmer.x;
  let targetY = farmer.y;
  if (farmer.state === FARMER_CHASE) {
    speed = chase;
    targetX = turkey.x;
    targetY = turkey.y;
  } else if (farmer.state === FARMER_SEARCH) {
    speed = search;
    targetX = farmer.lastSeenX;
    targetY = farmer.lastSeenY;
    farmer.searchFor -= dt;
    if (distance(farmer.x, farmer.y, targetX, targetY) < 24 || farmer.searchFor <= 0) {
      farmer.state = FARMER_PATROL;
      farmer.wait = FARMER.patrolWait;
    }
  } else {
    const point = farmer.waypoints[farmer.waypoint];
    targetX = point.x;
    targetY = point.y;
    if (farmer.wait > 0) {
      farmer.wait -= dt;
    } else if (distance(farmer.x, farmer.y, targetX, targetY) < 26) {
      farmer.wait = FARMER.patrolWait;
      farmer.waypoint = (farmer.waypoint + 1) % farmer.waypoints.length;
    }
  }

  const dx = targetX - farmer.x;
  const dy = targetY - farmer.y;
  const length = Math.hypot(dx, dy);
  if (length > 1 && farmer.wait <= 0) {
    const moved = slideMove(farmer.x, farmer.y, FARMER.radius, (dx / length) * speed * dt, (dy / length) * speed * dt, walls);
    farmer.x = moved.x;
    farmer.y = moved.y;
    farmer.bob += dt * 9;
  }
  return event;
}

/** Put the farmer back on patrol at his spawn after the turkey is hit. */
export function resetFarmer(farmer, spawn) {
  farmer.x = spawn.x;
  farmer.y = spawn.y;
  farmer.state = FARMER_PATROL;
  farmer.waypoint = 0;
  farmer.wait = 0;
  farmer.unseenFor = 0;
  farmer.searchFor = 0;
}
