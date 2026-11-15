import {isArtifactScanned} from './missionProgress.js';
import { bindSurfaceDirectionPad } from './surfaceDirectionPad';
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
  { x: 16, y: 77, aspect: 1.19, widthBonus: 1.35 }, // Sojourner, Ares Vallis
  { x: 34, y: 76, aspect: 1.16, widthBonus: 1.45 }, // Spirit, Home Plate
  { x: 52, y: 84, aspect: 1.16, widthBonus: 1.45 }, // Opportunity, Perseverance Valley
  { x: 73, y: 72, aspect: 1.84, widthBonus: 1.20 }, // Ingenuity, Valinor Hills
  { x: 87, y: 83, aspect: 1.73, widthBonus: 1.14 }, // Phoenix, Green Valley
];
const directions = {
  KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
};
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

export function mountMarsEngine(surface, onClosed) {
  const events = new AbortController();
  const on = (el, ev, handler) => el.addEventListener(ev, handler, { signal: events.signal });
  const terrain = surface.querySelector('.outer-terrain');
  const field = surface.querySelector('.outer-mars-field');
  const guide = surface.querySelector('.outer-field-guide');
  const scanned = new Set(mars.records.flatMap((record,index)=>isArtifactScanned('mars',record[0])?[index]:[]));
  const counters = surface.querySelector('.outer-lunar-scan-count');
  const controls = surface.querySelector('.outer-mars-controls');
  const card = controls.querySelector('.outer-lunar-card');
  const cardTitle = card.querySelector('.outer-lunar-card-title');
  const cardHint = card.querySelector('small');
  const previewCanvas = card.querySelector('canvas');
  const preview = previewCanvas.getContext('2d');
  preview.imageSmoothingEnabled = false;
  const siteNav = surface.querySelector('.outer-site-nav');
  siteNav.hidden=true;
  const siteLabel = document.createElement('div');
  siteLabel.className = 'outer-site-detail';
  siteLabel.setAttribute('aria-live','polite');
  surface.append(siteLabel);
  const viewer = createArtifactViewer('mars', () => ({markScanned(index) {
    scanned.add(index);
    markers[index]?.classList.add('is-collected');
    markers[index]?.setAttribute('aria-label', mars.records[index][1] + ' — collected ✓');
    updateCounter();
    refreshInspectors();
  }}));
  let locationIndex = 0;
  // All Martian artifacts stay visible in one continuous discovery scene.
  const navButtons = [];
  const keys = new Set();
  const padKeys = new Set();
  const directionPad = bindSurfaceDirectionPad(surface, padKeys, {
    canMove: () => playable(),
    onMove: () => { player.target = null; },
  });
  const player = { x: 25, y: 86, target: null, frame: 0, jump: 0, facing: 1 };
  const INSPECT_RANGE = 12.2;
  let nearestIndex = -1;
  const archiveOpen = () => document.documentElement.dataset.silentArchiveOpen === 'true';
  const playable = () => surface.open && surface.dataset.phase === 'landed' && !archiveOpen();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let rAF = 0;
  let lastTime = 0;
  let crewEgress = null;

  // Keep all machines in the same ground-plane perspective instead of floating
  // image boxes. Each illustration retains its own fine 2.5D pixel details.
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
    button.dataset.model = id;
    button.classList.toggle('is-collected', scanned.has(index));
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-label', scanned.has(index) ? record[1]+' — collected ✓' : 'Collect '+record[1]+' — click to inspect and scan');
    button.title = `${record[1]} • about ${heightM} m tall • inspect NASA archive`;
    button.style.left = `${x}%`;
    button.style.top = `${y}%`;
    button.style.zIndex = String(Math.round(y * 10));
    button.style.setProperty('--sprite-height', `${spriteHeight.toFixed(3)}cqh`);
    button.style.setProperty('--sprite-width', `${spriteWidth.toFixed(3)}cqh`);
    const icon = new Image();
    icon.loading = 'eager';
    icon.decoding = 'async';
    icon.src = surfaceSpriteUrl(id === 'spirit' || id === 'opportunity' ? 'twins' : id);
    icon.onerror = () => {
      icon.onerror = null;
      icon.src = `https://raw.githubusercontent.com/sithuaunglife/the-silent-legacy/main/public/assets/surface/${id === 'spirit' || id === 'opportunity' ? 'twins' : id}.webp`;
    };
    icon.alt = '';
    // A compact soil imprint / machinery shadow is rendered beneath the sprite,
    // rather than appearing as a floating asset pasted on a canvas.
    const footprint = document.createElement('i');
    footprint.className='outer-mars-artifact-footprint';
    footprint.setAttribute('aria-hidden','true');
    const label = document.createElement('span');
    label.className = 'outer-mars-marker-label';
    label.textContent = `${record[1]} · ${heightM}m`;
    button.append(footprint, icon, label);
    // Optional manual exploration: tapping a rover moves the astronaut to
    // it. Collect All is a separate button, never a tap on the equipment.
    on(button, 'click', () => {
      if (!playable()) return;
      player.target = {x: clamp(x + (player.x > x ? 4 : -4), 6, 94), y: clamp(y + (player.y > y ? 3 : -3), 58, 91)};
    });
    // Keep the preview current without creating one inspection button per item.
    on(icon, 'load', () => {
      if (index === nearestIndex) paintPreview(index);
    });
    field.append(button);
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

  // The same 44×44 pixel-art preview used in the lunar inspection card.
  function paintPreview(index) {
    const image = markers[index]?.querySelector('img');
    preview.clearRect(0, 0, 44, 44);
    if (!image?.complete || !image.naturalWidth) return;
    const scale = Math.min(38 / image.naturalWidth, 37 / image.naturalHeight);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    preview.drawImage(image, Math.round((44-width)/2), Math.round((44-height)/2), width, height);
  }

  function refreshInspectors() {
    let best = -1;
    let bestDistance = INSPECT_RANGE;
    for (let i = 0; i < locations.length; i++) {
      const { x, y } = locations[i];
      const distance = Math.hypot((player.x-x)*.85, (player.y-y)*1.5);
      if (distance < bestDistance) { bestDistance = distance; best = i; }
    }
    card.hidden = best < 0 || !playable();
    if (best < 0) { nearestIndex = -1; return; }

    const { x, y } = locations[best];
    const side = x > 71 ? 'left' : 'right';
    // The card is positioned by the artifact's ground contact, as on the Moon.
    // Keep all controls inside the modal at narrow viewport widths.
    const markerWidth = markers[best]?.getBoundingClientRect().width || 44;
    const horizontalGap = Math.max(3.8, markerWidth / Math.max(surface.clientWidth, 1) * 54);
    const cardX = side === 'left' ? x-horizontalGap : x+horizontalGap;
    card.style.left = `${clamp(cardX, 4, 87)}%`;
    card.style.top = `${clamp(y-10.5, 20, 82)}%`;
    card.style.transform = side === 'left' ? 'translate(-100%, -50%)' : 'translateY(-50%)';
    card.dataset.side = side;
    if (nearestIndex !== best) {
      nearestIndex = best;
      cardTitle.textContent = mars.records[best][1];
      card.setAttribute('aria-label', `Inspect ${mars.records[best][1]} NASA mission record`);
      paintPreview(best);
    }
    cardHint.textContent = scanned.has(best) ? 'SCANNED ✓ · INSPECT [E]' : 'Inspect artifact [E]';
  }

  function inspectNearest() {
    if (!playable() || nearestIndex < 0) return;
    // Recheck distance on click/keyboard to avoid stale proximity after movement.
    const { x, y } = locations[nearestIndex];
    if (Math.hypot((player.x-x)*.85, (player.y-y)*1.5) >= INSPECT_RANGE) return;
    player.target = null;
    keys.clear();
    viewer.show(mars.records[nearestIndex], nearestIndex);
  }
  on(card, 'click', inspectNearest);

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
    if (!surface.open || (surface.dataset.phase !== 'landed' && surface.dataset.phase !== 'egress')) {
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
    if (crewEgress) {
      crewEgress.time += dt;
      const u = Math.min(1, crewEgress.time / crewEgress.duration);
      const ease = u*u*(3-2*u);
      player.x = crewEgress.startX + (crewEgress.endX-crewEgress.startX)*ease;
      player.y = crewEgress.startY + (crewEgress.endY-crewEgress.startY)*ease;
      player.frame += dt*40;
      updatePerson();
      if (u >= 1) {
        const done = crewEgress.done;
        crewEgress = null;
        player.frame = 0;
        done();
      }
      rAF = requestAnimationFrame(tick);
      return;
    }
    if (player.jump) player.jump = player.jump + dt >= 0.85 ? 0 : player.jump + dt;
    let dx = 0, dy = 0;
    for (const key of [...keys, ...padKeys]) {
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
    player.x = 25;player.y = 86;player.target = null;
    player.frame = 0;player.jump = 0;player.facing=1;
    nearestIndex = -1;
    card.hidden = true;
    updatePerson();
    rAF = requestAnimationFrame(tick);
  }
  function stop() {
    cancelAnimationFrame(rAF);rAF = 0;lastTime = 0;
    keys.clear();directionPad.reset();player.target = null;
    nearestIndex = -1;
    card.hidden = true;
    crewEgress = null;
  }

  const marsJump=surface.querySelector('.outer-mars-jump');
  on(marsJump,'click',()=>{if(playable()&&!player.jump)player.jump=.001;});
  on(window, 'keydown', event => {
    if (!playable() || event.ctrlKey || event.altKey || event.metaKey || event.target?.matches?.('input,textarea,[contenteditable]')) return;
    if (event.code === 'Space') {
      event.preventDefault();
      if (!player.jump && !event.repeat) player.jump = 0.001;
      return;
    }
    if (event.code === 'KeyE' && !event.repeat && nearestIndex >= 0) {
      event.preventDefault(); inspectNearest(); return;
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

  on(window,'silent:mission-progress',event=>{
    const ids=event.detail?.progress?.mars;
    if(!Array.isArray(ids))return;
    mars.records.forEach((record,index)=>{
      if(!ids.includes(record[0]))return;
      scanned.add(index);
      markers[index]?.classList.add('is-collected');
      markers[index]?.setAttribute('aria-label',record[1]+' — collected ✓');
    });
    updateCounter();
  });
  const updateCounter = () => {
    counters.textContent = `Artifacts scanned ${scanned.size}/${mars.records.length}`;
    if (nearestIndex >= 0) cardHint.textContent = scanned.has(nearestIndex)
      ? 'SCANNED ✓ · INSPECT [E]' : 'Inspect artifact [E]';
  };
  function updateSiteLabel() {
    siteLabel.textContent='Illustrative artifact gallery — actual resting sites are documented individually.';
  }
  const transitions = createLandingSequence({
    surface, world: mars, onClosed,
    beforeLand() {
      stop();locationIndex=0;
      navButtons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===0)));
      paintMarsTerrain(terrain, mars, 'gallery');
      updateSiteLabel();updateCounter();
      siteNav.hidden=true;siteLabel.hidden=true;controls.hidden=true;
      // Show all Mars equipment from the first entry frame, as on the Moon.
      // Only the astronaut and interactive controls wait until touchdown.
      guide.hidden = true;
      field.hidden = false;
      person.hidden = true;
      markers.forEach(marker => { marker.hidden = false; });
    },
    onLanded({crewReady}) {
      guide.hidden=true;field.hidden=false;person.hidden=false;
      controls.hidden=true;siteNav.hidden=true;siteLabel.hidden=true;
      markers.forEach(marker=>{marker.hidden=false;});
      stop();
      player.x = 50;player.y = 70;player.target=null;
      player.frame=0;player.jump=0;player.facing=-1;
      card.hidden = true;
      updatePerson();
      const finish=()=>{controls.hidden=false;updateCounter();crewReady();};
      if (reducedMotion.matches) {
        player.x=25;player.y=86;
        updatePerson();finish();
        rAF=requestAnimationFrame(tick);
        return;
      }
      crewEgress = {startX:50,startY:70,endX:25,endY:86,time:0,duration:1.9,done:finish};
      rAF = requestAnimationFrame(tick);
    },
    beforeLeave() { stop();guide.hidden=true;field.hidden=false;person.hidden=true;siteNav.hidden=true;siteLabel.hidden=true;controls.hidden=true; },
  });
  return {
    land: transitions.land,
    destroy() { stop();directionPad.destroy();transitions.destroy();events.abort();viewer.destroy();siteLabel.remove();siteNav.replaceChildren(); },
  };
}
