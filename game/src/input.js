// Keyboard and mouse state. Movement keys give a direction; Space or a
// mouse click is a dash; Enter or a click confirms on the menu screens.

export const ACTION_CONFIRM = 'confirm';
export const ACTION_DASH = 'dash';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';

const MOVE_KEYS = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};

export function createInput(canvas) {
  const pressed = new Set();
  const queue = [];
  let dashQueued = false;
  let pointerX = 0;
  let pointerY = 0;

  function onKeyDown(event) {
    if (event.repeat) return;
    if (MOVE_KEYS[event.code]) {
      pressed.add(event.code);
      event.preventDefault();
      return;
    }
    if (event.code === 'Space') {
      dashQueued = true;
      event.preventDefault();
    } else if (event.code === 'Enter') {
      queue.push(ACTION_CONFIRM);
    } else if (event.code === 'KeyP') {
      queue.push(ACTION_PAUSE);
    } else if (event.code === 'KeyM') {
      queue.push(ACTION_MUTE);
    }
  }

  function onKeyUp(event) {
    pressed.delete(event.code);
  }

  function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    pointerX = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
    dashQueued = true;
    queue.push(ACTION_CONFIRM);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    /** Normalised movement direction from the keys held down. */
    direction() {
      let x = 0;
      let y = 0;
      for (const code of pressed) {
        const move = MOVE_KEYS[code];
        if (move) {
          x += move[0];
          y += move[1];
        }
      }
      const length = Math.hypot(x, y);
      if (length === 0) return { x: 0, y: 0 };
      return { x: x / length, y: y / length };
    },
    /** True once when Space was pressed or the mouse clicked. */
    takeDash() {
      const queued = dashQueued;
      dashQueued = false;
      return queued;
    },
    /** Drain the one-shot action queue (confirm / pause / mute). */
    takeActions() {
      const actions = queue.splice(0, queue.length);
      return actions;
    },
    pointer() {
      return { x: pointerX, y: pointerY };
    },
  };
}
