// Small plane geometry the whole game shares: circles against wall rects,
// sliding along walls, and line-of-sight checks through the walls.

export function clamp(value, low, high) {
  return value < low ? low : value > high ? high : value;
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

/** True when a circle of radius r at (x, y) overlaps a wall rectangle. */
export function circleHitsRect(x, y, r, rect) {
  const nearX = clamp(x, rect.x, rect.x + rect.w);
  const nearY = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - nearX;
  const dy = y - nearY;
  return dx * dx + dy * dy < r * r;
}

/** True when the circle overlaps any wall in the list. */
export function circleHitsWalls(x, y, r, walls) {
  for (let index = 0; index < walls.length; index += 1) {
    if (circleHitsRect(x, y, r, walls[index])) return true;
  }
  return false;
}

/**
 * Move a circle by (dx, dy) with wall sliding: try the full step, then
 * x-only, then y-only, and keep whichever parts do not hit a wall.
 */
export function slideMove(x, y, r, dx, dy, walls) {
  let nextX = x;
  let nextY = y;
  if (!circleHitsWalls(x + dx, y + dy, r, walls)) {
    nextX = x + dx;
    nextY = y + dy;
  } else if (!circleHitsWalls(x + dx, y, r, walls)) {
    nextX = x + dx;
  } else if (!circleHitsWalls(x, y + dy, r, walls)) {
    nextY = y + dy;
  }
  return { x: nextX, y: nextY };
}

/**
 * True when the segment from (x1, y1) to (x2, y2) is blocked by a wall:
 * sample the segment and report any sample landing inside a wall rect.
 * Hay bales never block sight; only walls do.
 */
export function sightBlocked(x1, y1, x2, y2, walls) {
  const samples = 28;
  for (let step = 1; step < samples; step += 1) {
    const t = step / samples;
    const px = x1 + (x2 - x1) * t;
    const py = y1 + (y2 - y1) * t;
    for (let index = 0; index < walls.length; index += 1) {
      const wall = walls[index];
      if (px >= wall.x && px <= wall.x + wall.w && py >= wall.y && py <= wall.y + wall.h) {
        return true;
      }
    }
  }
  return false;
}
