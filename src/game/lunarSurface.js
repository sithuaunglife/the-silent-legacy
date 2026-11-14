const Sprites = {
  drawPixelRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  },

  drawAstronaut(ctx, x, y, frame, facing, jetting, lift) {
    const shadowWidth = Math.max(6, 16 - lift * .18);
    this.drawPixelRect(ctx, x - shadowWidth / 2, y + 2, shadowWidth, 4, "rgba(10,12,18,0.6)");
    const bob = Math.abs(Math.sin(frame * 0.25)) * 2;
    const ay = y - bob - lift;

    // RCS Thruster flame
    if (jetting) {
      this.drawPixelRect(ctx, x - facing * 8 - 2, ay - 8, 5, 9 + Math.random() * 5, "#38bdf8");
    }

    // PLSS Backpack
    const packX = facing === 1 ? x - 8 : x + 2;
    this.drawPixelRect(ctx, packX, ay - 22, 6, 12, "#cbd5e1");
    this.drawPixelRect(ctx, packX + 1, ay - 20, 4, 3, "#64748b");

    // Legs (animated walk)
    const stride = Math.sin(frame * 0.25) * 3;
    this.drawPixelRect(ctx, x - 4 + stride, ay - 9, 4, 9, "#e2e8f0");
    this.drawPixelRect(ctx, x + 1 - stride, ay - 9, 4, 9, "#cbd5e1");

    // Torso
    this.drawPixelRect(ctx, x - 5, ay - 21, 10, 12, "#f8fafc");
    this.drawPixelRect(ctx, x - 2, ay - 18, 4, 4, "#ef4444"); // Chest control unit

    // Helmet & Gold Visor
    this.drawPixelRect(ctx, x - 5, ay - 30, 10, 9, "#ffffff");
    const visorX = facing === 1 ? x - 1 : x - 5;
    this.drawPixelRect(ctx, visorX, ay - 28, 6, 5, "#f59e0b");
    this.drawPixelRect(ctx, visorX + 1, ay - 27, 2, 2, "#fef3c7");
  },
};

const HORIZON_Y = 290;
const GROUND_MIN_Y = 308;
const GROUND_MAX_Y = 497;

const stars = Array.from({ length: 115 }, () => ({
  x: Math.floor(Math.random() * 960),
  y: Math.floor(Math.random() * 265),
  size: Math.random() > 0.85 ? 2 : 1,
  bright: 0.4 + Math.random() * 0.6
}));

const mountainHeights = [];
for (let x = 0; x <= 960; x += 6) {
  const h =
    Math.sin(x * 0.0065) * 24 +
    Math.cos(x * 0.014) * 14 +
    Math.sin(x * 0.03) * 5 +
    46;
  mountainHeights.push({ x, h });
}

const groundSpeckles = Array.from({ length: 420 }, () => ({
  x: Math.floor(Math.random() * 960),
  y: GROUND_MIN_Y - 16 + Math.floor(Math.random() * (540 - GROUND_MIN_Y + 16)),
  w: Math.random() > 0.7 ? 4 : 2,
  h: 2,
  color: Math.random() > 0.5 ? "#525866" : "#7e8596"
}));

const craters = [
  { x: 190, y: 360, rx: 48, ry: 10 },
  { x: 820, y: 325, rx: 38, ry: 8 },
  { x: 125, y: 502, rx: 76, ry: 16 },
  { x: 740, y: 454, rx: 74, ry: 16 }
];

const sites = [
  { x: 155, y: 420, width: 106 },
  { x: 345, y: 485, width: 101 },
  { x: 645, y: 350, width: 70 },
  { x: 825, y: 410, width: 86 },
];
const shipHatch = { x: 495, y: 350 };
const jumpDuration = .92;

export function createLunarSurface(surface, terrain, records, openArtifact) {
  const listeners = new AbortController();
  const on = (node, name, fn) => node.addEventListener(name, fn, {signal: listeners.signal});
  const ctx = terrain.getContext('2d');
  const background = document.createElement('canvas');
  background.width = 960;
  background.height = 540;
  const sky = background.getContext('2d');
  const ground = document.createElement('canvas');
  ground.width = 960;
  ground.height = 540;
  const rock = ground.getContext('2d');
  const card = surface.querySelector('.outer-lunar-card');
  const cardTitle = card.querySelector('.outer-lunar-card-title');
  const preview = card.querySelector('canvas').getContext('2d');
  const jumpButton = surface.querySelector('.outer-lunar-jump');
  const count = surface.querySelector('.outer-lunar-scan-count');
  const scanned = new Set();
  const keys = new Set();
  const directions = {
    KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1],
    KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
  };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const player = { x: 542, y: 368, facing: 1, step: 0, jumpTime: 0 };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const archiveOpen = () => document.documentElement.dataset.silentArchiveOpen === 'true';
  const playable = () => surface.open && surface.dataset.world === 'moon' && surface.dataset.phase === 'landed';
  let target;
  let activeSite;
  let frame = 0;
  let lastTime = 0;
  let boarding;
  const models = records.map(([id], index) => {
    const image = new Image();
    on(image, 'load', () => {
      if (!surface.open || surface.dataset.world !== 'moon') return;
      if (index === activeSite) paintPreview(index);
      if (surface.dataset.phase !== 'boarding') draw(playable());
    });
    image.src = `/assets/surface/${id}.webp`;
    return image;
  });

  sky.fillStyle = '#02040b';
  sky.fillRect(0, 0, 960, HORIZON_Y);
  for (const star of stars) {
    sky.fillStyle = `rgba(179, 207, 248, ${star.bright})`;
    sky.fillRect(star.x, star.y, star.size, star.size);
  }
  for (const { x, h } of mountainHeights) {
    sky.fillStyle = '#252d3c';
    sky.fillRect(x, HORIZON_Y - Math.round(h), 6, Math.ceil(h));
    const foreground = Math.round(h * .63 + Math.sin(x * .018) * 11);
    sky.fillStyle = '#3c4556';
    sky.fillRect(x, HORIZON_Y - foreground, 6, foreground);
  }
  paintLunarGround();

  function drawModel(context, index, x, y, width) {
    const model = models[index];
    if (!model.complete || !model.naturalWidth) return;
    const height = Math.round(width * model.naturalHeight / model.naturalWidth);
    context.imageSmoothingEnabled = false;
    context.drawImage(model, Math.round(x - width / 2), Math.round(y - height), width, height);
  }

  function groundPoint({ x, y }) {
    const depth = clamp((y - HORIZON_Y) / (540 - HORIZON_Y), 0, 1);
    return { x: 480 + (x - 480) * (.73 + depth * .27), y, scale: .66 + depth * .56 };
  }

  function paintLunarGround() {
    const shades = ['#343c51','#424d64','#505c73','#5c677c','#656f84','#717b8e'];
    for (let y = HORIZON_Y; y < 540; y += 2) {
      for (let x = 0; x < 960; x += 8) {
        const depth = (y - HORIZON_Y) / 250;
        const relief = Math.sin(x * .014 + y * .044) * .55 + Math.sin(x * .038 - y * .08) * .38;
        rock.fillStyle = shades[clamp(Math.floor(depth * 4.6 + relief + 1), 0, shades.length - 1)];
        rock.fillRect(x, y, 8, 2);
      }
    }
    for (const fleck of groundSpeckles) {
      const { x, y, scale } = groundPoint(fleck);
      rock.fillStyle = fleck.color;
      rock.fillRect(Math.round(x), y, Math.round(fleck.w * scale), Math.round(fleck.h * scale));
    }
    for (const crater of craters) {
      const { x, y, scale } = groundPoint(crater);
      for (let row = -crater.ry; row <= crater.ry; row += 2) {
        const span = Math.round(crater.rx * scale * Math.sqrt(1 - (row / crater.ry) ** 2));
        rock.fillStyle = row > crater.ry * .4 ? '#8490a7' : row > 0 ? '#546078' : '#30394f';
        rock.fillRect(Math.round(x - span), y + row, span * 2, 2);
      }
    }
  }

  function paintPreview(index) {
    preview.clearRect(0, 0, 44, 44);
    drawModel(preview, index, 22, 38, 36);
  }

  function draw(showPlayer) {
    ctx.drawImage(background, 0, 0);
    ctx.drawImage(ground, 0, 0);
    const entities = sites.map((site, index) => ({ y: site.y, paint: () => {
      const point = groundPoint(site);
      const width = Math.round(site.width * point.scale);
      ctx.fillStyle = '#12192555';
      ctx.fillRect(Math.round(point.x - width * .30), site.y - 2, Math.round(width * .60), Math.round(6 * point.scale));
      if (showPlayer && !boarding && activeSite === index) {
        ctx.fillStyle = scanned.has(index) ? '#9ee6bd' : '#a0d4ff';
        ctx.fillRect(Math.round(point.x - width / 2), site.y + 4, width, 2);
      }
      drawModel(ctx, index, point.x, site.y, width);
    } }));
    if (showPlayer) {
      if (target) {
        const point = groundPoint(target);
        ctx.strokeStyle = '#a0d4ff';
        ctx.strokeRect(Math.round(point.x) - 5, point.y - 3, 10, 6);
      }
      entities.push({ y: player.y, paint: () => {
        const point = groundPoint(player);
        ctx.save();
        ctx.translate(Math.round(point.x), player.y);
        ctx.scale(point.scale, point.scale);
        Sprites.drawAstronaut(ctx, 0, 0, reducedMotion.matches ? 0 : player.step, player.facing,
          !reducedMotion.matches && boosting(), jumpHeight());
        ctx.restore();
      } });
    }
    entities.sort((first, second) => first.y - second.y);
    for (const entity of entities) entity.paint();
  }

  function selectNearest() {
    let nearest = 0;
    let distance = Infinity;
    for (const [index, site] of sites.entries()) {
      const range = Math.hypot(player.x - site.x, player.y - site.y);
      if (range < distance) {
        nearest = index;
        distance = range;
      }
    }
    if (nearest === activeSite) return;
    activeSite = nearest;
    cardTitle.textContent = records[nearest][1];
    paintPreview(nearest);
  }

  function investigate(index) {
    target = null;
    keys.clear();
    openArtifact(records[index], index);
  }

  function boosting() {
    return keys.has('ShiftLeft') || keys.has('ShiftRight');
  }

  function jumpHeight() {
    return (reducedMotion.matches ? 20 : 60) * Math.sin(Math.PI * player.jumpTime / jumpDuration);
  }

  function jump() {
    if (!playable() || archiveOpen() || player.jumpTime) return;
    player.jumpTime = .001;
  }

  function tick(now) {
    frame = 0;
    if (archiveOpen()) { frame = requestAnimationFrame(tick); return; }
    if (!playable() && !boarding) return;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, .05) : 0;
    lastTime = now;
    if (boarding) {
      boarding.time += dt;
      const t = Math.min(1, boarding.time / boarding.duration);
      player.x = boarding.x + (shipHatch.x - boarding.x) * t;
      player.y = boarding.y + (shipHatch.y - boarding.y) * t;
      player.step += dt * 55;
      draw(t < 1);
      if (t === 1) {
        const finish = boarding.finish;
        boarding = null;
        finish();
      } else {
        frame = requestAnimationFrame(tick);
      }
      return;
    }
    if (!archiveOpen()) {
      if (player.jumpTime) player.jumpTime = player.jumpTime + dt >= jumpDuration ? 0 : player.jumpTime + dt;
      let dx = 0;
      let dy = 0;
      for (const key of keys) {
        const direction = directions[key];
        if (!direction) continue;
        dx += direction[0];
        dy += direction[1];
      }
      if (dx || dy) target = null;
      if (target) {
        dx = target.x - player.x;
        dy = target.y - player.y;
        if (Math.hypot(dx, dy) < 5) {
          const destination = target;
          target = null;
          if (destination.site !== undefined) investigate(destination.site);
          dx = dy = 0;
        }
      }
      const length = Math.hypot(dx, dy);
      if (length) {
        const speed = boosting() ? 180 : 108;
        const travel = target ? Math.min(length, speed * dt) : speed * dt;
        player.x = clamp(player.x + dx / length * travel, 25, 935);
        player.y = clamp(player.y + dy / length * travel, GROUND_MIN_Y, GROUND_MAX_Y);
        if (Math.abs(dx) > .1) player.facing = Math.sign(dx);
        player.step += dt * 55;
      } else {
        player.step = 0;
      }
      selectNearest();
      draw(true);
    }
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = lastTime = 0;
    keys.clear();
    target = null;
    boarding = null;
  }

  on(window, 'keydown', event => {
    if (!playable() || archiveOpen() || event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.code === 'Space') {
      event.preventDefault();
      if (!event.repeat) jump();
      return;
    }
    if (event.code === 'KeyE' && !event.repeat) investigate(activeSite);
    if (directions[event.code] || event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      event.preventDefault();
      keys.add(event.code);
    }
  });
  on(window, 'keyup', event => keys.delete(event.code));
  on(window, 'blur', () => keys.clear());
  on(jumpButton, 'click', jump);
  on(card, 'click', () => investigate(activeSite));
  on(terrain, 'click', event => {
    if (!playable() || archiveOpen()) return;
    const box = terrain.getBoundingClientRect();
    const x = (event.clientX - box.left) * terrain.width / box.width;
    const y = (event.clientY - box.top) * terrain.height / box.height;
    const index = sites.findIndex((site, index) => {
      const image = models[index];
      const point = groundPoint(site);
      const width = site.width * point.scale;
      const height = image.naturalWidth ? width * image.naturalHeight / image.naturalWidth : 42;
      return Math.abs(point.x - x) < width / 2 && y > site.y - height - 5 && y < site.y + 12;
    });
    if (index !== -1) {
      const site = sites[index];
      if (Math.hypot(player.x - site.x, player.y - site.y) < 75 || reducedMotion.matches) investigate(index);
      else target = { x: site.x, y: clamp(site.y + 18, GROUND_MIN_Y, GROUND_MAX_Y), site: index };
    } else if (y >= HORIZON_Y) {
      const groundY = clamp(y, GROUND_MIN_Y, GROUND_MAX_Y);
      const horizontalScale = (groundPoint({ x: 960, y: groundY }).x - 480) / 480;
      target = { x: clamp(480 + (x - 480) / horizontalScale, 25, 935), y: groundY };
    }
  });

  function updateCount() {
    count.textContent = `Artifacts scanned ${scanned.size}/${sites.length}`;
  }

  return {
    paint() {
      stop();
      terrain.width = 960;
      terrain.height = 540;
      draw(false);
    },
    start() {
      Object.assign(player, { x: 542, y: 368, facing: 1, step: 0, jumpTime: 0 });
      activeSite = undefined;
      selectNearest();
      updateCount();
      draw(true);
      frame = requestAnimationFrame(tick);
    },
    board(finish) {
      stop();
      player.jumpTime = 0;
      if (reducedMotion.matches) {
        draw(false);
        finish();
        return;
      }
      const distance = Math.hypot(player.x - shipHatch.x, player.y - shipHatch.y);
      boarding = { x: player.x, y: player.y, duration: clamp(distance / 270, .45, 2), time: 0, finish };
      player.facing = player.x < shipHatch.x ? 1 : -1;
      frame = requestAnimationFrame(tick);
    },
    stop,
    destroy() { stop(); listeners.abort(); },
    isScanned: index => scanned.has(index),
    markScanned(index) {
      scanned.add(index);
      updateCount();
    },
  };
}
