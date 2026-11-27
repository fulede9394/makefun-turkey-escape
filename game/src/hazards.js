// The dangers and the treats: carving knives that patrol a line, ovens
// that glow hot, hay bales to hide in, and corn (plus one golden feather)
// to collect. Knives and corn are pure data; the world steps them.
import { KNIFE } from './settings.js';

/** A knife slides back and forth along its line, turning at each end. */
export function createKnife(x1, y1, x2, y2, speed, phase) {
  return { x1, y1, x2, y2, speed, t: phase ?? 0, forward: true };
}

/** Advance a knife one step and return its current point. */
export function stepKnife(knife, dt) {
  const length = Math.hypot(knife.x2 - knife.x1, knife.y2 - knife.y1);
  const step = (knife.speed * dt) / Math.max(length, 1);
  knife.t += knife.forward ? step : -step;
  if (knife.t >= 1) {
    knife.t = 1;
    knife.forward = false;
  } else if (knife.t <= 0) {
    knife.t = 0;
    knife.forward = true;
  }
  return knifePoint(knife);
}

export function knifePoint(knife) {
  return {
    x: knife.x1 + (knife.x2 - knife.x1) * knife.t,
    y: knife.y1 + (knife.y2 - knife.y1) * knife.t,
    angle: Math.atan2(knife.y2 - knife.y1, knife.x2 - knife.x1),
  };
}

/** The knife's reach as a circle, for the turkey's hit test. */
export function knifeReach() {
  return KNIFE.radius;
}

/** A corn cob (or the one golden feather) waiting to be collected. */
export function createPickup(x, y, golden) {
  return { x, y, golden: Boolean(golden), taken: false };
}
