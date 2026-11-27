// All the drawing: the farm in three moods, the turkey and the farmer,
// the HUD, and the title / paused / caught / escaped screens. One canvas,
// one logical field (960 by 600) scaled to fit the window.
import { FIELD, PALETTE, TURKEY } from './settings.js';
import { distanceMetres, stageName, worldScore } from './levels.js';
import { knifePoint } from './hazards.js';
import { FARMER_CHASE, FARMER_SEARCH } from './farmer.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';

function ground(ctx, world) {
  const stage = world.stage;
  if (stage === 0) {
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.grassDark;
    for (let index = 0; index < 26; index += 1) {
      const x = ((index * 173) % 940) + 10;
      const y = ((index * 97) % 560) + 20;
      ctx.beginPath();
      ctx.ellipse(x, y, 26, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = PALETTE.dirt;
    ctx.fillRect(0, 286, FIELD.width, 28);
  } else if (stage === 1) {
    ctx.fillStyle = PALETTE.barnFloor;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.strokeStyle = PALETTE.barnLine;
    ctx.lineWidth = 3;
    for (let y = 40; y < FIELD.height; y += 56) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(FIELD.width, y);
      ctx.stroke();
    }
  } else {
    for (let row = 0; row < 10; row += 1) {
      for (let col = 0; col < 16; col += 1) {
        ctx.fillStyle = (row + col) % 2 === 0 ? PALETTE.tileA : PALETTE.tileB;
        ctx.fillRect(col * 60, row * 60, 60, 60);
      }
    }
  }
}

function drawExit(ctx, world) {
  const exit = world.exit;
  const pulse = 0.55 + 0.25 * Math.sin(world.time * 3);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.exitGlow;
  ctx.fillRect(exit.x - 4, exit.y - 4, exit.w + 8, exit.h + 8);
  ctx.restore();
  ctx.fillStyle = '#2f6b2a';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = PALETTE.exitGlow;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = world.stage === 2 ? 'WOODS' : 'EXIT';
  if (exit.w > exit.h) ctx.fillText(`${label} →`, exit.x + exit.w / 2, exit.y + exit.h / 2 + 12);
  else ctx.fillText(label, exit.x + exit.w / 2, exit.y + exit.h / 2);
  ctx.fillText('➤', exit.x + exit.w / 2, exit.y + exit.h / 2 - 12);
}

function drawWalls(ctx, world) {
  for (const wall of world.walls) {
    if (world.stage === 2) {
      ctx.fillStyle = PALETTE.counter;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = PALETTE.counterTop;
      ctx.fillRect(wall.x, wall.y, wall.w, 7);
    } else {
      ctx.fillStyle = PALETTE.fence;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = PALETTE.fenceTop;
      ctx.fillRect(wall.x, wall.y, wall.w, 5);
    }
  }
}

function drawBales(ctx, world) {
  for (const bale of world.bales) {
    ctx.fillStyle = PALETTE.hay;
    ctx.beginPath();
    ctx.arc(bale.x, bale.y, bale.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.hayDark;
    ctx.lineWidth = 2;
    for (let index = 0; index < 7; index += 1) {
      const angle = (index / 7) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(bale.x + Math.cos(angle) * bale.r * 0.3, bale.y + Math.sin(angle) * bale.r * 0.3);
      ctx.lineTo(bale.x + Math.cos(angle) * bale.r * 0.85, bale.y + Math.sin(angle) * bale.r * 0.85);
      ctx.stroke();
    }
  }
}

function drawOvens(ctx, world) {
  for (const oven of world.ovens) {
    const flicker = 0.65 + 0.35 * Math.sin(world.time * 7 + oven.x);
    ctx.fillStyle = PALETTE.ovenBody;
    ctx.fillRect(oven.x, oven.y, oven.w, oven.h);
    ctx.save();
    ctx.globalAlpha = flicker;
    ctx.fillStyle = PALETTE.ovenGlow;
    ctx.beginPath();
    ctx.moveTo(oven.x + 14, oven.y + oven.h - 10);
    ctx.lineTo(oven.x + oven.w / 2, oven.y + 12);
    ctx.lineTo(oven.x + oven.w - 14, oven.y + oven.h - 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffd27d';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OVEN', oven.x + oven.w / 2, oven.y + oven.h - 6);
  }
}

function drawKnives(ctx, world) {
  for (const knife of world.knives) {
    ctx.save();
    ctx.strokeStyle = 'rgba(215, 222, 232, 0.5)';
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(knife.x1, knife.y1);
    ctx.lineTo(knife.x2, knife.y2);
    ctx.stroke();
    ctx.restore();
    const point = knifePoint(knife);
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(point.angle);
    ctx.fillStyle = PALETTE.knifeBlade;
    ctx.beginPath();
    ctx.moveTo(-18, -5);
    ctx.lineTo(12, -5);
    ctx.lineTo(20, 0);
    ctx.lineTo(12, 5);
    ctx.lineTo(-18, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.knifeHandle;
    ctx.fillRect(-28, -5, 11, 10);
    ctx.restore();
  }
}

function drawCorn(ctx, world) {
  for (const cob of world.corn) {
    if (cob.taken) continue;
    ctx.fillStyle = PALETTE.cornHusk;
    ctx.beginPath();
    ctx.ellipse(cob.x, cob.y + 8, 7, 5, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.corn;
    ctx.beginPath();
    ctx.ellipse(cob.x, cob.y, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d9a400';
    ctx.fillRect(cob.x - 5, cob.y - 6, 10, 2);
    ctx.fillRect(cob.x - 5, cob.y, 10, 2);
    ctx.fillRect(cob.x - 5, cob.y + 6, 10, 2);
  }
  const feather = world.feather;
  if (feather && !feather.taken) {
    const glow = 0.6 + 0.4 * Math.sin(world.time * 4);
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(feather.x, feather.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = PALETTE.feather;
    ctx.beginPath();
    ctx.ellipse(feather.x, feather.y, 6, 13, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9b98a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(feather.x - 3, feather.y + 10);
    ctx.lineTo(feather.x + 3, feather.y - 10);
    ctx.stroke();
  }
}

function drawTurkey(ctx, world) {
  const turkey = world.turkey;
  if (turkey.invulnerable > 0 && Math.floor(world.time * 12) % 2 === 0) return;
  const bob = turkey.moving ? Math.sin(turkey.bob) * 2 : Math.sin(world.time * 2) * 1;
  ctx.save();
  if (turkey.hidden) ctx.globalAlpha = 0.55;
  ctx.translate(turkey.x, turkey.y + bob);
  ctx.scale(turkey.face, 1);
  // Tail fan.
  ctx.fillStyle = PALETTE.turkeyTail;
  for (let index = -2; index <= 2; index += 1) {
    ctx.save();
    ctx.rotate(index * 0.32 - Math.PI / 2 + Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(-16, -6, 7, 15, index * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Body and wing.
  ctx.fillStyle = PALETTE.turkeyBody;
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.turkeyWing;
  ctx.beginPath();
  ctx.ellipse(-3, 2, 10, 7, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Head, beak, wattle, eye.
  ctx.fillStyle = PALETTE.turkeyHead;
  ctx.beginPath();
  ctx.arc(13, -11, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.beak;
  ctx.beginPath();
  ctx.moveTo(19, -13);
  ctx.lineTo(27, -10);
  ctx.lineTo(19, -7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.wattle;
  ctx.beginPath();
  ctx.arc(17, -4, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d1d1d';
  ctx.beginPath();
  ctx.arc(15, -13, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Feet.
  ctx.strokeStyle = '#e8912d';
  ctx.lineWidth = 2;
  const step = turkey.moving ? Math.sin(turkey.bob) * 4 : 0;
  ctx.beginPath();
  ctx.moveTo(-4, 12);
  ctx.lineTo(-4 + step, 17);
  ctx.moveTo(5, 12);
  ctx.lineTo(5 - step, 17);
  ctx.stroke();
  ctx.restore();
}

function drawFarmer(ctx, world) {
  const farmer = world.farmer;
  const bob = Math.sin(farmer.bob) * 2;
  ctx.save();
  ctx.translate(farmer.x, farmer.y + bob);
  // Legs and overalls.
  ctx.fillStyle = PALETTE.farmerOveralls;
  ctx.fillRect(-11, 2, 22, 16);
  ctx.strokeStyle = '#1d2f45';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, 17);
  ctx.lineTo(-6, 22);
  ctx.moveTo(6, 17);
  ctx.lineTo(6, 22);
  ctx.stroke();
  // Shirt and arms.
  ctx.fillStyle = PALETTE.farmerShirt;
  ctx.fillRect(-13, -12, 26, 16);
  ctx.fillRect(-20, -10, 7, 14);
  ctx.fillRect(13, -10, 7, 14);
  // Head and straw hat.
  ctx.fillStyle = PALETTE.farmerSkin;
  ctx.beginPath();
  ctx.arc(0, -19, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerHat;
  ctx.beginPath();
  ctx.ellipse(0, -26, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-8, -33, 16, 8);
  // Mood mark: ! when chasing, ? when searching.
  if (farmer.state === FARMER_CHASE) {
    ctx.fillStyle = PALETTE.danger;
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', 0, -44);
  } else if (farmer.state === FARMER_SEARCH) {
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', 0, -44);
  }
  ctx.restore();
}

function drawParticles(ctx, world) {
  for (const particle of world.particles) {
    ctx.save();
    ctx.globalAlpha = 1 - particle.t / particle.life;
    ctx.fillStyle = PALETTE.feather;
    ctx.beginPath();
    ctx.ellipse(particle.x, particle.y, 4, 2.5, particle.t * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  for (const pop of world.pops) {
    ctx.save();
    ctx.globalAlpha = 1 - pop.t / pop.life;
    ctx.fillStyle = PALETTE.hud;
    ctx.strokeStyle = '#2b1d12';
    ctx.lineWidth = 3;
    ctx.strokeText(pop.text, pop.x, pop.y);
    ctx.fillText(pop.text, pop.x, pop.y);
    ctx.restore();
  }
}

function drawHud(ctx, world, best) {
  const turkey = world.turkey;
  ctx.fillStyle = 'rgba(30, 18, 8, 0.78)';
  ctx.fillRect(0, 0, FIELD.width, 34);
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.hud;
  ctx.fillText(`SCORE ${worldScore(world)}`, 12, 18);
  ctx.fillText(`DIST ${distanceMetres(world)}m`, 150, 18);
  ctx.fillText(`STAGE ${world.stage + 1} · ${stageName(world)}`, 300, 18);
  // Lives as hearts.
  for (let index = 0; index < TURKEY.lives; index += 1) {
    ctx.fillStyle = index < world.lives ? '#e23b2e' : 'rgba(255,247,224,0.25)';
    ctx.fillText('♥', 520 + index * 22, 18);
  }
  // Dash cooldown bar.
  const dashReady = turkey.dashCooldown <= 0;
  ctx.fillStyle = 'rgba(255,247,224,0.25)';
  ctx.fillRect(620, 10, 90, 14);
  ctx.fillStyle = dashReady ? '#7fd069' : '#e8b64c';
  const dashFill = dashReady ? 1 : 1 - turkey.dashCooldown / 1.1;
  ctx.fillRect(620, 10, 90 * dashFill, 14);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(dashReady ? 'DASH READY' : 'DASH…', 716, 18);
  // Heat meter, only while the turkey is hot.
  if (turkey.heat > 0.02) {
    ctx.fillStyle = 'rgba(255,247,224,0.25)';
    ctx.fillRect(830, 10, 100, 14);
    ctx.fillStyle = '#ff7a1a';
    ctx.fillRect(830, 10, 100 * turkey.heat, 14);
    ctx.fillStyle = PALETTE.hud;
    ctx.fillText('HEAT', 836, 18);
  }
  // Alerts under the bar.
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  if (world.farmer.state === FARMER_CHASE) {
    ctx.fillStyle = Math.floor(world.time * 6) % 2 === 0 ? PALETTE.danger : '#ffd94d';
    ctx.fillText('SPOTTED! RUN!', FIELD.width / 2, 56);
  } else if (turkey.hidden) {
    ctx.fillStyle = '#7fd069';
    ctx.fillText('HIDDEN IN THE HAY', FIELD.width / 2, 56);
  }
  if (best > 0) {
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,247,224,0.7)';
    ctx.fillText(`BEST ${best}`, FIELD.width - 12, FIELD.height - 12);
  }
}

function overlay(ctx, lines, title, titleColor) {
  ctx.fillStyle = 'rgba(20, 12, 6, 0.74)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = titleColor;
  ctx.font = 'bold 62px sans-serif';
  ctx.fillText(title, FIELD.width / 2, 150);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '20px sans-serif';
  let y = 220;
  for (const line of lines) {
    ctx.fillText(line, FIELD.width / 2, y);
    y += 32;
  }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    const offsetX = (canvas.width - FIELD.width * scale) / 2;
    const offsetY = (canvas.height - FIELD.height * scale) / 2;
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  }

  return {
    draw(world, screen, best) {
      fit();
      ctx.fillStyle = '#2b1d12';
      ctx.fillRect(-100, -100, FIELD.width + 200, FIELD.height + 200);
      ground(ctx, world);
      drawExit(ctx, world);
      drawWalls(ctx, world);
      drawBales(ctx, world);
      drawOvens(ctx, world);
      drawKnives(ctx, world);
      drawCorn(ctx, world);
      drawTurkey(ctx, world);
      drawFarmer(ctx, world);
      drawParticles(ctx, world);
      if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
        drawHud(ctx, world, best);
      }
      if (screen === SCREEN_TITLE) {
        drawHud(ctx, world, best);
        overlay(
          ctx,
          [
            'The Great Thanksgiving Escape',
            'Thanksgiving is coming — and you are the dinner.',
            'Outrun the farmer, dodge the oven and the carving knives,',
            'grab the corn, hide in the hay, and reach the gate.',
            '',
            'Move: arrow keys or WASD · Dash: Space or click · Pause: P · Mute: M',
            '',
            'Press ENTER or click to start',
          ],
          'TURKEY TROT',
          '#f2a541',
        );
      } else if (screen === SCREEN_PAUSED) {
        overlay(ctx, ['Press P to keep running'], 'PAUSED', PALETTE.hud);
      } else if (screen === SCREEN_CAUGHT) {
        overlay(
          ctx,
          [
            'The farmer got you. Thanksgiving dinner it is.',
            `Score: ${worldScore(world)} · Distance: ${distanceMetres(world)}m`,
            '',
            'Press ENTER to try again',
          ],
          'CAUGHT!',
          PALETTE.danger,
        );
      } else if (screen === SCREEN_ESCAPED) {
        overlay(
          ctx,
          [
            'You made it to the woods. Happy Thanksgiving — somewhere else.',
            `Score: ${worldScore(world)} · Distance: ${distanceMetres(world)}m · Best: ${best}`,
            '',
            'Press ENTER to play again',
          ],
          'ESCAPED!',
          '#7fd069',
        );
      }
    },
  };
}
