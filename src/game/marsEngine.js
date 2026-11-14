import { mars } from '../data/mars';
import { ASTRONAUT_ATLAS_URL } from '../data/astronautSprite';
import { ASTRONAUT_HEIGHT_METERS, SURFACE_HEIGHTS_METERS, surfaceSpriteUrl } from '../data/surfaceScale';
import { createArtifactViewer } from './artifactViewer';
import { createLandingSequence } from './landingSequence';
import { paintMarsTerrain } from './marsTerrain';

/**
 * The same physical-height baseline applies to every Martian machine and the
 * astronaut. Art has isometric perspective, so widths remain artistic.
 * Small real machines intentionally stay small, but have >=44px hit targets.
 */
const locations = [
  { x: 22, y: 77, aspect: 1.19, widthBonus: 1.35 }, // Sojourner, 30cm tall
  { x: 41, y: 68, aspect: 1.16, widthBonus: 1.45 }, // Spirit / Opportunity, 1.5m
  { x: 67, y: 69, aspect: 1.84, widthBonus: 1.2 }, // Ingenuity, 49cm
  { x: 83, y: 84, aspect: 1.73, widthBonus: 1.14 }, // Phoenix lander
];
const directions = {
  KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
};
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

export function mountMarsEngine(surface, onClosed) {
  const terrain = surface.querySelector('.outer-terrain');
  const field = surface.querySelector('.outer-mars-field');
  const guide = surface.querySelector('.outer-field-guide');
  const viewer = createArtifactViewer('mars');
  const events = new AbortController();
  const on = (el, ev, handler) => el.addEventListener(ev, handler, { signal: events.signal });
  const keys = new Set();
  const player = { x: 54, y: 82, target: null, frame: 0, jump: 0, facing: 1 };
  const INSPECT_RANGE = 9.8;
  let nearestIndex = -1;
  const archiveOpen = () => document.documentElement.dataset.silentArchiveOpen === 'true';
  const playable = () => surface.open && surface.dataset.phase === 'landed' && !archiveOpen();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let rAF = 0;
  let lastTime = 0;

  // Keep all machines in the same ground-plane perspective instead of floating
  // image boxes. Each illustration retains its own fine 2.5D pixel details.
  const inspectors = [];
  const markers = mars.records.map((record, index) => {
    const { x, y, aspect, widthBonus } = locations[index];
    const id = record[0];
    const heightM = SURFACE_HEIGHTS_METERS[id];
    const depth = 0.78 + (y - 55) / 85;
    const spriteHeight = Math.max(0.1, heightM * 5.3 * depth);
    const spriteWidth = spriteHeight * aspect * widthBonus;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'outer-mars-marker';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-label', `Explore ${record[1]} (${heightM} m, size compared to astronaut)`);
    button.title = `${record[1]} • about ${heightM} m tall • inspect NASA archive`;
    button.style.left = `${x}%`;
    button.style.top = `${y}%`;
    button.style.zIndex = String(Math.round(y * 10));
    button.style.setProperty('--sprite-height', `${spriteHeight.toFixed(3)}cqh`);
    button.style.setProperty('--sprite-width', `${spriteWidth.toFixed(3)}cqh`);
    const icon = new Image();
    icon.loading = 'eager';
    icon.decoding = 'async';
    icon.src = surfaceSpriteUrl(id);
    icon.onerror = () => {
      icon.onerror = null;
      icon.src = `https://raw.githubusercontent.com/sithuaunglife/the-silent-legacy/main/public/assets/surface/${id}.webp`;
    };
    icon.alt = '';
    const label = document.createElement('span');
    label.className = 'outer-mars-marker-label';
    label.textContent = `${record[1]} · ${heightM}m`;
    button.append(icon, label);
    // Machine click guides the astronaut over; information opens only nearby.
    on(button, 'click', () => {
      if (!playable()) return;
      player.target = {x: clamp(x + (player.x > x ? 4 : -4), 6, 94), y: clamp(y + (player.y > y ? 3 : -3), 58, 91)};
    });
    const inspect = document.createElement('button');
    inspect.type = 'button';
    inspect.className = 'outer-mars-inspect';
    inspect.textContent = '⌕ INSPECT [E]';
    inspect.setAttribute('aria-label', `Inspect ${record[1]} NASA mission data`);
    inspect.hidden = true;
    inspect.style.left = `${x}%`;
    inspect.style.top = `${y}%`;
    inspect.style.zIndex = String(Math.round(y * 10) + 4);
    inspect.dataset.side = x > 72 ? 'left' : 'right';
    on(inspect, 'click', () => {
      if (playable() && nearestIndex === index) viewer.show(record);
    });
    inspectors.push(inspect);
    field.append(button,inspect);
    return button;
  });

  // User-supplied Myanmar-flag astronaut sprite: same face, colors and four poses.
  const person = document.createElement('div');
  person.className = 'outer-mars-person';
  person.setAttribute('aria-label', `Astronaut, human-scale ${ASTRONAUT_HEIGHT_METERS} meters`);
  person.setAttribute('role', 'img');
  const body = document.createElement('span');
  body.className = 'outer-mars-avatar';
  body.style.backgroundImage = `url("${ASTRONAUT_ATLAS_URL}")`;
  person.append(body);
  field.append(person);

  function refreshInspectors() {
    let best = -1;
    let bestDistance = INSPECT_RANGE;
    for (let i = 0; i < locations.length; i++) {
      const {x,y} = locations[i];
      const distance = Math.hypot((player.x - x) * .85, (player.y - y) * 1.5);
      if (distance < bestDistance) { bestDistance=distance; best=i; }
    }
    nearestIndex = best;
    inspectors.forEach((button,i) => {button.hidden = i !== best;});
  }

  function updatePerson() {
    person.style.left = `${player.x}%`;
    person.style.top = `${player.y}%`;
    person.style.zIndex = String(Math.round(player.y * 10));
    const heightScale = 0.79 + (player.y - 54) / 95;
    person.style.setProperty('--person-scale', heightScale.toFixed(3));
    const walking = Math.abs(player.frame) > 0 && !reducedMotion.matches;
    const pose = walking ? 1 + Math.floor(player.frame / 6) % 3 : 0;
    body.style.backgroundPosition = `${pose * (100 / 3)}% 0`;
    const jumping = player.jump > 0 ? Math.sin(Math.PI * player.jump / 0.85) * 39 : 0;
    // The supplied walking poses face right; mirror only when travelling left.
    body.style.transform = `translateY(${-Math.round(jumping)}px) scaleX(${player.facing < 0 ? -1 : 1})`;
    refreshInspectors();
  }

  function tick(now) {
    if (!surface.open || surface.dataset.phase !== 'landed') {
      rAF = 0;
      lastTime = 0;
      return;
    }
    if (archiveOpen()) {
      lastTime = 0;
      rAF = requestAnimationFrame(tick);
      return;
    }
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.06) : 0;
    lastTime = now;
    if (player.jump) player.jump = player.jump + dt >= 0.85 ? 0 : player.jump + dt;
    let dx = 0, dy = 0;
    for (const key of keys) {
      const direction = directions[key];
      if (!direction) continue;
      dx += direction[0];dy += direction[1];
    }
    if (dx || dy) player.target = null;
    if (player.target) {
      dx = player.target.x - player.x;
      dy = player.target.y - player.y;
      if (Math.hypot(dx, dy) < 0.8) { player.target = null; dx = dy = 0; }
    }
    const length = Math.hypot(dx, dy);
    if (length) {
      const speed = player.target ? Math.min(length, 17 * dt) : 17 * dt;
      if(Math.abs(dx) > .035)player.facing = Math.sign(dx);
      player.x = clamp(player.x + dx / length * speed, 6, 94);
      player.y = clamp(player.y + dy / length * speed, 58, 91);
      player.frame += dt * 40;
    } else player.frame = 0;
    updatePerson();
    rAF = requestAnimationFrame(tick);
  }
  function start() {
    cancelAnimationFrame(rAF);
    rAF = 0;lastTime = 0;
    player.x = 54;player.y = 82;player.target = null;
    player.frame = 0;player.jump = 0;player.facing=1;
    updatePerson();
    rAF = requestAnimationFrame(tick);
  }
  function stop() {
    cancelAnimationFrame(rAF);rAF = 0;lastTime = 0;
    keys.clear();player.target = null;
  }

  on(window, 'keydown', event => {
    if (!playable() || event.ctrlKey || event.altKey || event.metaKey || event.target?.matches?.('input,textarea,[contenteditable]')) return;
    if (event.code === 'Space') {
      event.preventDefault();
      if (!player.jump && !event.repeat) player.jump = 0.001;
      return;
    }
    if (event.code === 'KeyE' && !event.repeat && nearestIndex >= 0) {
      event.preventDefault(); viewer.show(mars.records[nearestIndex]); return;
    }
    if (directions[event.code]) { event.preventDefault();keys.add(event.code); }
  });
  on(window, 'keyup', event => keys.delete(event.code));
  on(window, 'blur', () => keys.clear());
  on(terrain, 'click', event => {
    if (!playable() || event.target !== terrain) return;
    const box = terrain.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width * 100;
    const y = (event.clientY - box.top) / box.height * 100;
    if (y > 55) player.target = { x: clamp(x, 6, 94), y: clamp(y, 58, 91) };
  });

  const transitions = createLandingSequence({
    surface, world: mars, onClosed,
    beforeLand() {
      stop();paintMarsTerrain(terrain, mars);
      guide.hidden = true;field.hidden = true;
    },
    onLanded() { guide.hidden = true;field.hidden = false;start(); },
    beforeLeave() { stop();guide.hidden = true;field.hidden = true; },
  });
  return {
    land: transitions.land,
    destroy() { stop();transitions.destroy();events.abort();viewer.destroy(); },
  };
}
