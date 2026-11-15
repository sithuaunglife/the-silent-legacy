/** Scope all flight state, listeners and animation frames to this mounted scene. */
export function mountOuterSpaceEngine(root, { onLand }) {
  const listeners = new AbortController();
  const on = (node, name, fn) => node.addEventListener(name, fn, { signal: listeners.signal });

  const stage = root;
  const starsCanvas = root.querySelector('.outer-stars');
  const chartCanvas = root.querySelector('.outer-chart');
  const debrisCanvas = root.querySelector('.outer-debris');
  const routeCanvas = root.querySelector('.outer-route');
  const starsContext = starsCanvas.getContext('2d');
  const chartContext = chartCanvas.getContext('2d');
  const debrisContext = debrisCanvas.getContext('2d');
  const routeContext = routeCanvas.getContext('2d');
  const ship = root.querySelector('.outer-ship');
  const entryWash = root.querySelector('.outer-entry-wash');
  const probe = root.querySelector('.outer-probe');
  const solarFlare = root.querySelector('.outer-solar-flares');
  const flareContext = solarFlare.getContext('2d');
  const record = root.querySelector('.outer-record');
  const flightPanel = root.querySelector('.outer-flight');
  const status = root.querySelector('.outer-status');
  const graph = root.querySelector('.outer-graph');
  const fullscreen = root.querySelector('.outer-fullscreen');
  const surfaces = [...root.querySelectorAll('.outer-surface')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const planetButtons = [...root.querySelectorAll('[data-planet]')];
  const movementButtons = [...root.querySelectorAll('[data-move]')];
  const destinations = [...root.querySelectorAll('[data-go]')];
  const cancelButton = root.querySelector('.outer-cancel');
  const progress = root.querySelector('.outer-progress');
  const keyCodes = { w: 'KeyW', a: 'KeyA', s: 'KeyS', d: 'KeyD' };
  const bodies = {
    earth: { x: -111, y: 0, z: 224, size: 255, node: root.querySelector('.outer-earth') },
    moon: { size: 88, node: planetButtons[0] },
    mars: { x: 561, y: 48, z: -349, size: 167, node: planetButtons[1] },
    sun: { x: -694, y: 223, z: -520, size: 142, node: root.querySelector('.outer-sun') },
    probe: { size: 26, node: probe },
    ship: { x: 0, y: 0, z: 0, size: 57, node: ship },
  };
  const satellites = [...root.querySelectorAll('.outer-satellite')].map((node, index) => ({
    node, phase: .40 + index * 2.1, radius: 145 + index * 19,
    period: 24 + index * 8, tilt: [.30, -.48, .66][index],
  }));
  const distantBodies = [
    ['mercury', -475, 212, -1050, 31], ['venus', -778, -36, -970, 54],
    ['jupiter', 700, 166, -925, 83], ['saturn', 508, -24, -1110, 73],
    ['uranus', -515, -20, -1240, 58], ['neptune', 1115, -119, -1190, 57],
  ].map(([name, x, y, z, size]) => ({ x, y, z, size: size * 1.19, node: root.querySelector(`[data-distant="${name}"]`) }));
  const camera = { x: 0, z: 0, distance: 1090 };
  const mapView = { x: 0, z: 0 };
  const pitch = .64;
  const sinPitch = Math.sin(pitch);
  const cosPitch = Math.cos(pitch);
  const keysDown = new Set();
  const touchDown = new Map();
  const velocity = { x: 0, y: 0, z: 0 };
  const clamp = (n, low, high) => Math.min(high, Math.max(low, n));
  let viewport;
  let frame = 0;
  let previousTime = 0;
  let elapsed = 0;
  const modalOpen = () => document.documentElement.dataset.silentArchiveOpen === 'true' || record.open || surfaces.some(dialog => dialog.open);
  let autopilot = null;
  let parking = null;
  let waitingForFlight = true;
  let departure;
  const orbitalPassDuration = 3.8;
  const entryDuration = 1.65;
  const exitDuration = 1.55;
  const orbitView = { zoom: 1, offsetX: 0, offsetY: 0 };
  let heading = -.56;

  const asteroidPixels = [
    ['...hh.....','..hllhh...','.hlllmmd..','hllmmlmdd.','hmmllmmdd.','.hmmmdmdd.','..dddddd..','...ddd....'],
    ['..hhh...','.hllmh..','hllmmhd.','hlmmmdhd','.hmddddd','..hddddd','...dddd.'],
    ['...hh...','..hhmhd.','.hlmmdd.','hlmmmdhd','hmmdmddd','.hddddd.','..dddd..','...dd...'],
  ];
  const asteroidPalette = { h: '#5c6277', l: '#86889e', m: '#52566c', d: '#272e41' };
  const asteroids = [
    [-470,38,-480,0,13], [-289,58,-380,2,13], [290,90,-420,1,17],
    [210,22,-151,0,16], [610,17,-75,2,21], [-429,-5,108,1,15],
    [445,-20,196,2,20], [575,6,308,0,11], [-260,133,-530,1,12],
    [82,26,38,1,12], [-572,42,-260,0,12], [392,20,19,0,14],
  ];
  const lunarAsteroids = Array.from({ length: 10 }, (_, index) => ({
    angle: index * 2.39996,
    radius: 79 + random(index + 37) * 71,
    size: 11 + Math.round(random(index + 66) * 13),
    shape: index % asteroidPixels.length,
  }));

  function lunarOrbit(angle) {
    const side = Math.sin(angle);
    return { x: bodies.earth.x + Math.cos(angle) * 404, y: bodies.earth.y + 24 - side * 40, z: bodies.earth.z - 70 + side * 230 };
  }

  function updateBodies() {
    const time = reducedMotion.matches ? 0 : elapsed;
    Object.assign(bodies.moon, lunarOrbit(-2.52 + time * .077));
    const probeAngle = -2.46 + time * .18;
    Object.assign(bodies.probe, { x: bodies.earth.x + Math.cos(probeAngle) * 218, y: bodies.earth.y + 5, z: bodies.earth.z + Math.sin(probeAngle) * 107 });
  }

  function random(seed) {
    const value = Math.sin(seed * 83.127 + 2.71) * 43758.5453;
    return value - Math.floor(value);
  }

  const flameRays = Array.from({ length: 76 }, (_, index) => {
    const angle = index * Math.PI * 2 / 76;
    return { x: Math.cos(angle), y: Math.sin(angle), angle, seed: random(index + 329) };
  });
  const flareColors = ['#b52b2175', '#f65a2494', '#ff9b36b8', '#ffe397b3'];
  let flareFrame = -1;

  function drawSolarFlares() {
    if (!flareContext) return;
    const frame = reducedMotion.matches ? 0 : Math.floor(elapsed * 20);
    if (frame === flareFrame) return;
    flareFrame = frame;
    const ctx = flareContext;
    ctx.clearRect(0, 0, 96, 96);
    for (const { x, y, angle, seed } of flameRays) {
      const pulse = (1 + Math.sin(angle * 7 - frame * .16 + seed) * Math.cos(angle * 4 + frame * .09)) * .5;
      const length = Math.round(3 + 13 * pulse ** 2 + seed * 3);
      for (let step = 0; step <= length; step += 2) {
        ctx.fillStyle = flareColors[3 - Math.min(3, Math.floor(step / length * 4))];
        const curl = Math.sin(step * .16 - frame * .15 + angle * 3) * step * .14;
        ctx.fillRect(Math.round(48 + x * (26 + step) - y * curl), Math.round(48 + y * (26 + step) + x * curl), 3, 3);
      }
    }
  }

  const stars = Array.from({ length: 95 }, (_, index) => ({
    x: random(index * 7 + 3),
    y: random(index * 7 + 4),
    phase: random(index * 7 + 5) * Math.PI * 2,
    depth: random(index * 7 + 6),
  }));

  // Rotate world coordinates into the tilted camera, then divide by depth.
  function projectWorld({ x, y, z }, view = camera) {
    const forward = z - view.z;
    const depth = camera.distance - y * sinPitch - forward * cosPitch;
    const scale = viewport.focal / depth;
    return {
      x: viewport.width / 2 + (x - view.x) * viewport.xScale * scale,
      y: viewport.height * .53 - (y * cosPitch - forward * sinPitch) * scale,
      scale,
      depth,
    };
  }

  function project(body) {
    const point = projectWorld(body);
    point.x = point.x * orbitView.zoom + orbitView.offsetX;
    point.y = point.y * orbitView.zoom + orbitView.offsetY;
    point.scale *= orbitView.zoom;
    return point;
  }

  function renderSatellites(earthPosition) {
    const earth = bodies.earth;
    const time = reducedMotion.matches ? 0 : elapsed;
    for (const satellite of satellites) {
      const phase = satellite.phase + time * 2 * Math.PI / satellite.period;
      const tilt = satellite.tilt;
      const lateral = Math.cos(phase) * satellite.radius;
      const forward = Math.sin(phase) * satellite.radius;
      const point = project({
        x: earth.x + lateral,
        y: earth.y + forward * tilt,
        z: earth.z + forward * Math.sqrt(1 - tilt * tilt),
      });
      satellite.node.style.setProperty('--object-x', Math.round(point.x) + 'px');
      satellite.node.style.setProperty('--object-y', Math.round(point.y) + 'px');
      satellite.node.style.setProperty('--antenna-angle', Math.round(tilt * 45 + Math.cos(phase) * 15) + 'deg');
      satellite.node.style.zIndex = Number(earth.node.style.zIndex) + (point.depth > earthPosition.depth ? -1 : 1);
    }
  }

  function unproject(screenX, screenY, depth) {
    const { width, height, focal, xScale } = viewport;
    const scale = focal / depth;
    const forward = camera.distance - depth;
    const rise = (height * .53 - screenY) / scale;
    return {
      x: (screenX - width / 2) / (xScale * scale),
      y: forward * sinPitch + rise * cosPitch,
      z: forward * cosPitch - rise * sinPitch,
    };
  }

  function positionShipAtEarth() {
    const earth = projectWorld(bodies.earth, mapView);
    const gap = clamp(earth.scale * bodies.earth.size * .72, 46, 195);
    const left = earth.x - gap;
    const point = unproject(Math.max(25, left), earth.y + 15 + Math.max(0, 25 - left) * .6, earth.depth + 20);
    Object.assign(bodies.ship, point);
    departure ??= point;
  }

  function frameOrbitView() {
    orbitView.zoom = 1;
    orbitView.offsetX = orbitView.offsetY = 0;
    const flight = autopilot;
    if (!flight || flight.phase === 'approach') return;
    const target = bodies[flight.target];
    const center = projectWorld(target);
    const viewSize = Math.min(viewport.width, viewport.height);
    const zoom = clamp(viewSize * .40 / (center.scale * orbitRadius(target)), 1, 3.4);
    let focus = 1;
    let closeup = 0;
    if (flight.phase === 'orbit') focus = ease(clamp(flight.time / .88, 0, 1));
    if (flight.phase === 'entry') closeup = ease(clamp(flight.time / entryDuration, 0, 1));
    if (flight.phase === 'exit') {
      const t = ease(clamp(flight.time / exitDuration, 0, 1));
      focus = 1 - t;
      closeup = 1 - t;
    }
    const closeZoom = Math.hypot(viewport.width, viewport.height) * 1.10 / (center.scale * target.size);
    orbitView.zoom += (zoom - 1) * focus + Math.max(0, closeZoom - zoom) * closeup;
    orbitView.offsetX = focus * (viewport.width * .5 - center.x) - center.x * (orbitView.zoom - 1);
    orbitView.offsetY = focus * (viewport.height * .48 - center.y) - center.y * (orbitView.zoom - 1);
  }

  function ease(t) {
    return t * t * (3 - 2 * t);
  }

  function measure() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    const focal = Math.min(height * 1.015, width * 1.30);
    viewport = { width, height, focal, xScale: clamp(width * .76 / focal, .43, 1.38) };
    for (const canvas of [starsCanvas, chartCanvas, debrisCanvas, routeCanvas]) {
      canvas.width = width;
      canvas.height = height;
    }
    updateBodies();
    if (waitingForFlight) positionShipAtEarth();
    render();
  }

  function drawStars() {
    if (!starsContext) return;
    const { width, height } = viewport;
    const time = reducedMotion.matches ? 0 : elapsed;
    starsContext.clearRect(0, 0, width, height);
    for (const star of stars) {
      const speed = 3 + star.depth * 13;
      const x = (star.x * width - camera.x * star.depth * .13 - time * speed) % width;
      const y = (star.y * height - camera.z * star.depth * .11 + time * speed * .14) % height;
      const sx = Math.round(x < 0 ? x + width : x);
      const sy = Math.round(y < 0 ? y + height : y);
      const size = star.depth > .82 ? 2 : 1;
      starsContext.globalAlpha = (.65 + Math.sin(time * 1.45 + star.phase) * .27) * (.35 + star.depth * .56);
      starsContext.fillStyle = star.depth > .65 ? '#bce9ff' : '#f6d4dc';
      starsContext.fillRect(sx, sy, size, size);
      if (star.depth > .96) {
        starsContext.fillRect(sx - 2, sy, 6, 1);
        starsContext.fillRect(sx, sy - 2, 1, 6);
      }
    }
    starsContext.globalAlpha = 1;
  }

  function drawAsteroids(ctx) {
    if (!ctx) return;
    ctx.clearRect(0, 0, viewport.width, viewport.height);
    const time = reducedMotion.matches ? 0 : elapsed;
    function drawRock(point, shape, size, opacity) {
      if (point.x < -24 || point.x > viewport.width + 24 || point.y < -24 || point.y > viewport.height + 24) return;
      const unit = clamp(Math.round(point.scale * size / 9), 1, 3);
      ctx.globalAlpha = opacity;
      const startX = Math.round(point.x) - unit * 4;
      const startY = Math.round(point.y) - unit * 3;
      for (const [row, line] of asteroidPixels[shape].entries()) {
        for (let column = 0; column < line.length; column++) {
          const color = asteroidPalette[line[column]];
          if (!color) continue;
          ctx.fillStyle = color;
          ctx.fillRect(startX + column * unit, startY + row * unit, unit, unit);
        }
      }
    }
    for (const [x, y, z, shape, size] of asteroids) {
      const point = project({
        x: x + Math.sin(time * .24 + x) * 14,
        y: y + Math.cos(time * .21 + y) * 5,
        z,
      });
      drawRock(point, shape, size, .67);
    }
    const moon = bodies.moon;
    for (const rock of lunarAsteroids) {
      const angle = rock.angle + time * .135;
      const point = project({ x: moon.x + Math.cos(angle) * rock.radius, y: moon.y + Math.sin(angle) * rock.radius * .64, z: moon.z + Math.sin(angle) * 32 });
      drawRock(point, rock.shape, rock.size, .9);
      if (rock.shape === 1) {
        ctx.globalAlpha = .5;
        ctx.fillStyle = '#7eabca';
        ctx.fillRect(Math.round(point.x) - 6, Math.round(point.y) + 1, 2, 1);
        ctx.fillRect(Math.round(point.x) - 9, Math.round(point.y) + 2, 2, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawChart() {
    if (!chartContext || chartCanvas.hidden) return;
    const ctx = chartContext;
    ctx.clearRect(0, 0, viewport.width, viewport.height);
    const near = 620;
    const far = -760;
    ctx.beginPath();
    for (let x = -1480; x <= 1480; x += 74) {
      const start = project({ x, y: -39, z: far });
      const end = project({ x, y: -39, z: near });
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
    }
    for (let z = far; z <= near; z += 69) {
      const start = project({ x: -1480, y: -39, z });
      const end = project({ x: 1480, y: -39, z });
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
    }
    ctx.strokeStyle = '#548dcf35';
    ctx.lineWidth = 1;
    ctx.stroke();

    for (const scale of [1, 1.2]) {
      ctx.beginPath();
      const earth = bodies.earth;
      for (let step = 0; step <= 64; step++) {
        const angle = step * Math.PI / 32;
        const p = project({
          x: earth.x + Math.cos(angle) * 199 * scale,
          y: earth.y + 5,
          z: earth.z + Math.sin(angle) * 98 * scale,
        });
        if (step) ctx.lineTo(p.x, p.y);
        else ctx.moveTo(p.x, p.y);
      }
      ctx.strokeStyle = scale === 1 ? '#93c8ff91' : '#71a5d95b';
      ctx.setLineDash(scale === 1 ? [3, 5] : []);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.beginPath();
    for (let step = 0; step <= 96; step++) {
      const point = project(lunarOrbit(step * Math.PI / 48));
      if (step) ctx.lineTo(point.x, point.y);
      else ctx.moveTo(point.x, point.y);
    }
    ctx.strokeStyle = '#86b6d84f';
    ctx.setLineDash([3, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawRoute(positions) {
    if (!routeContext) return;
    const ctx = routeContext;
    ctx.clearRect(0, 0, viewport.width, viewport.height);
    const flight = autopilot;
    if (!flight || flight.phase === 'entry' || flight.phase === 'exit') return;
    if (flight.phase === 'orbit') {
      const sweep = orbitSweep(flight.time);
      ctx.beginPath();
      for (let i = 0; i <= 22; i++) {
        const point = project(orbitPosition(flight, Math.max(0, sweep - i * .053)));
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      }
      ctx.strokeStyle = flight.target === 'mars' ? '#ffb68d96' : '#99dcffa1';
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }
    const start = positions.ship;
    const end = positions[flight.target];
    const color = flight.target === 'mars' ? '#ffb68d' : '#99dcff';
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    if (distance < 40) return;
    const offset = end.scale * bodies[flight.target].size / 2 + 9;
    const finish = Math.max(0, distance - offset);
    if (finish < 20) return;
    ctx.save();
    ctx.translate(start.x, start.y);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = .53;
    ctx.setLineDash([2, 6]);
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(finish, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = .75;
    ctx.fillStyle = color;
    for (let x = 43; x < finish; x += 54) {
      for (let step = 0; step < 3; step++) {
        ctx.fillRect(x + step * 2, -5 + step * 2, 2, 2);
        ctx.fillRect(x + step * 2, 3 - step * 2, 2, 2);
      }
    }
    ctx.restore();
  }

  function place(body, position, minSize = body === bodies.ship ? 28 : 44) {
    const { node } = body;
    const closeup = autopilot?.target && body === bodies[autopilot.target] &&
      (autopilot.phase === 'entry' || autopilot.phase === 'exit');
    const size = closeup ? Math.max(minSize, body.size * position.scale) :
      clamp(body.size * position.scale, minSize, body === bodies.ship ? 105 : 315);
    node.style.setProperty('--object-x', Math.round(position.x) + 'px');
    node.style.setProperty('--object-y', Math.round(position.y) + 'px');
    node.style.setProperty('--object-size', Math.round(size) + 'px');
  }

  function render() {
    if (!viewport) return;
    frameOrbitView();
    stage.style.setProperty('--sky-x', clamp(-camera.x * .17, -9, 9) + 'px');
    stage.style.setProperty('--sky-y', clamp(-camera.z * .13, -9, 9) + 'px');
    drawStars();
    drawSolarFlares();
    drawChart();
    drawAsteroids(debrisContext);
    for (const body of distantBodies) place(body, project(body), 8);

    const positions = Object.fromEntries(Object.entries(bodies).map(([key, body]) => [key, project(body)]));
    const keys = Object.keys(bodies).sort((a, b) => positions[b].depth - positions[a].depth);
    for (const [index, key] of keys.entries()) {
      place(bodies[key], positions[key]);
      bodies[key].node.style.zIndex = String(3 + index);
    }
    probe.style.setProperty('--probe-size', Math.round(clamp(positions.probe.scale * bodies.probe.size, 17, 40)) + 'px');
    renderSatellites(positions.earth);
    drawRoute(positions);
    const entering = autopilot?.phase === 'entry';
    const leaving = autopilot?.phase === 'exit';
    const transition = entering ? autopilot.time / entryDuration : leaving ? 1 - autopilot.time / exitDuration : 0;
    entryWash.style.opacity = ease(clamp((transition - .26) / .66, 0, 1)).toFixed(3);
    // Avoid intermittent ship disappearance: hide only during final atmospheric entry.
    ship.style.opacity = String(1 - ease(clamp((transition - .90) / .10, 0, 1)));
    // The ship always renders above planet geometry while navigating; it only fades at touchdown.
    ship.style.zIndex = '80';

    const flicker = reducedMotion.matches ? 0 : Math.sin(Math.floor(elapsed * 21) * 2.39);
    const thrust = .32 + Math.min(1, Math.hypot(velocity.x, velocity.z) / 320) * .75 + (autopilot ? .2 : 0);
    const spriteFrame = (Math.round(heading / (Math.PI / 4)) + 8) % 8;
    ship.style.setProperty('--ship-frame', String(spriteFrame));
    // A precomputed CSS percentage avoids unsupported calc() background positions.
    ship.style.setProperty('--ship-position', (spriteFrame * 100 / 7).toFixed(5) + '%');
    ship.style.setProperty('--ship-heading', heading.toFixed(4) + 'rad');
    ship.style.setProperty('--flame-length', (.6 + thrust * .35 + flicker * .08).toFixed(2));
    ship.style.setProperty('--engine-sparks', (.38 + thrust * .30 + flicker * .17).toFixed(2));
  }

  function active(code) {
    return keysDown.has(code) || [...touchDown.values()].includes(code);
  }

  function refreshKeys() {
    for (const button of movementButtons) button.toggleAttribute('data-active', active(button.dataset.move));
  }

  function stopMovement() {
    keysDown.clear();
    touchDown.clear();
    velocity.x = velocity.y = velocity.z = 0;
    refreshKeys();
  }

  function followFlight(before, delta) {
    const player = bodies.ship;
    const after = project(player);
    if (Math.hypot(after.x - before.x, after.y - before.y) > .045) {
      const angle = Math.atan2(after.y - before.y, after.x - before.x);
      heading += Math.atan2(Math.sin(angle - heading), Math.cos(angle - heading)) * Math.min(1, delta * 18);
    }
    if (!reducedMotion.matches) {
      const blend = 1 - Math.exp(-delta * 5);
      camera.x += ((player.x - departure.x) * .14 - camera.x) * blend;
      camera.z += ((player.z - departure.z) * .18 - camera.z) * blend;
    }
  }

  function orbitRadius(body) {
    return body.size * .72 + 68;
  }

  function orbitPosition({ target, side }, sweep = 0) {
    const body = bodies[target];
    const angle = sweep + (side === 1 ? .36 : Math.PI - .36);
    const radius = orbitRadius(body);
    return {
      x: body.x + Math.cos(angle) * radius,
      y: body.y + 6 - Math.sin(angle) * radius * .31,
      z: body.z + Math.sin(angle) * radius * .86,
    };
  }

  function orbitSweep(time) {
    const t = clamp(time / orbitalPassDuration, 0, 1);
    return Math.PI * 2 * (t - Math.sin(t * Math.PI * 2) * .47 / (Math.PI * 2));
  }

  function entryPoint(body) {
    return { x: body.x, y: body.y + body.size * .22, z: body.z + body.size * .40 };
  }

  function startAutopilot(target) {
    if (autopilot?.target === target || autopilot?.phase === 'exit') return;
    waitingForFlight = false;
    stopMovement();
    parking = null;
    const player = bodies.ship;
    const flight = { target, side: player.x < bodies[target].x ? -1 : 1 };
    const end = orbitPosition(flight);
    const distance = Math.hypot(end.x - player.x, end.y - player.y, end.z - player.z);
    const duration = clamp(distance / 250, 2.2, 4.7);
    if (reducedMotion.matches) {
      Object.assign(player, end);
      completeApproach(flight);
    } else {
      autopilot = { ...flight, start: { x: player.x, y: player.y, z: player.z }, time: 0, duration, phase: 'approach' };
      progress.value = 0;
    }
    updateReadout();
    render();
    startLoop();
  }

  function completeApproach(flight) {
    parking = flight;
    autopilot = null;
    stopMovement();
    updateReadout();
    onLand(flight.target);
  }

  function startDeparture({ detail }) {
    if (!parking || parking.target !== detail) return;
    if (!reducedMotion.matches) {
      autopilot = { ...parking, phase: 'exit', time: 0 };
      Object.assign(bodies.ship, entryPoint(bodies[detail]));
      progress.value = 0;
    } else {
      Object.assign(bodies.ship, orbitPosition(parking));
    }
    updateReadout();
    render();
  }

  function endAutopilot() {
    if (!autopilot && !parking && !waitingForFlight) return;
    waitingForFlight = false;
    autopilot = parking = null;
    velocity.x = velocity.y = velocity.z = 0;
    updateReadout();
  }

  function stepAutopilot(delta) {
    const player = bodies.ship;
    const before = project(player);
    const old = { x: player.x, y: player.y, z: player.z };
    const flight = autopilot;
    flight.time += delta;
    const circling = flight.phase === 'orbit';
    const entering = flight.phase === 'entry';
    const leaving = flight.phase === 'exit';
    const duration = { approach: flight.duration, orbit: orbitalPassDuration, entry: entryDuration, exit: exitDuration }[flight.phase];
    const t = Math.min(1, flight.time / duration);
    if (circling) {
      Object.assign(player, orbitPosition(flight, orbitSweep(flight.time)));
    } else {
      const position = ease(entering ? Math.min(1, t * 1.20) : leaving ? t ** 1.3 : t);
      const arc = 4 * position * (1 - position);
      const orbit = orbitPosition(flight);
      const entry = entryPoint(bodies[flight.target]);
      const start = entering ? orbit : leaving ? entry : flight.start;
      const end = entering ? entry : orbit;
      player.x = start.x + (end.x - start.x) * position;
      player.y = start.y + (end.y - start.y) * position + (entering ? 8 : leaving ? 38 : 95) * arc;
      player.z = start.z + (end.z - start.z) * position - (entering || leaving ? 0 : 52) * arc;
    }
    if (delta) {
      velocity.x = (player.x - old.x) / delta;
      velocity.y = (player.y - old.y) / delta;
      velocity.z = (player.z - old.z) / delta;
    }
    const completed = circling ? flight.duration : entering ? flight.duration + orbitalPassDuration : 0;
    progress.value = leaving ? t : (completed + t * duration) / (flight.duration + orbitalPassDuration + entryDuration);
    followFlight(before, delta);
    if (t < 1) return;
    if (entering) {
      completeApproach(flight);
    } else if (leaving) {
      autopilot = null;
      stopMovement();
      updateReadout();
    } else {
      flight.phase = circling ? 'entry' : 'orbit';
      flight.time = 0;
      updateReadout();
    }
  }

  function stepFlight(delta) {
    const player = bodies.ship;
    const x = Number(active('KeyD')) - Number(active('KeyA'));
    const z = Number(active('KeyS')) - Number(active('KeyW'));
    const length = Math.hypot(x, z) || 1;
    const blend = 1 - Math.exp(-delta * 9);
    const speed = 320;
    velocity.x += (x / length * speed - velocity.x) * blend;
    velocity.z += (z / length * speed - velocity.z) * blend;

    const before = project(player);
    player.z = clamp(player.z + velocity.z * delta, -555, 382);
    const range = project(player).depth * (viewport.width * .45) / (viewport.focal * viewport.xScale);
    player.x = clamp(player.x + velocity.x * delta, camera.x - range, camera.x + range);
    followFlight(before, delta);
  }

  function tick(now) {
    frame = 0;
    const delta = previousTime ? Math.min((now - previousTime) / 1000, .15) : 0;
    previousTime = now;
    if (!viewport || modalOpen()) return;
    elapsed += delta;
    updateBodies();
    if (waitingForFlight) positionShipAtEarth();
    else if (autopilot) stepAutopilot(delta);
    else if (parking) {
      const before = project(bodies.ship);
      Object.assign(bodies.ship, orbitPosition(parking));
      followFlight(before, delta);
    } else stepFlight(Math.min(delta, .06));
    if (modalOpen()) return;
    render();
    frame = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (!frame && !modalOpen()) {
      previousTime = 0;
      frame = requestAnimationFrame(tick);
    }
  }

  function updateReadout() {
    const leaving = autopilot?.phase === 'exit';
    if (autopilot) {
      const name = autopilot.target === 'moon' ? 'Moon' : 'Mars';
      status.textContent = {
        approach: `Autopilot to ${name}`,
        orbit: `Circling ${name}`,
        entry: autopilot.target === 'moon' ? 'Descending toward the lunar surface' : 'Entering the Martian atmosphere',
        exit: `Climbing into orbit around ${name}`,
      }[autopilot.phase];
      stage.dataset.flightWorld = autopilot.target;
      stage.dataset.flightPhase = autopilot.phase;
    } else {
      delete stage.dataset.flightWorld;
      delete stage.dataset.flightPhase;
    }
    flightPanel.hidden = !autopilot;
    progress.hidden = !autopilot;
    cancelButton.hidden = !autopilot || leaving;
    for (const button of destinations) button.disabled = leaving || button.dataset.go === autopilot?.target;
    for (const button of planetButtons) button.disabled = leaving;
  }

  on(window, 'keydown', event => {
    if (event.key === 'Escape' && autopilot && autopilot.phase !== 'exit' && !modalOpen()) endAutopilot();
    const code = keyCodes[event.key.toLowerCase()];
    if (!code || event.altKey || event.ctrlKey || event.metaKey || modalOpen() || autopilot?.phase === 'exit' ||
        event.target instanceof HTMLElement && event.target.isContentEditable ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName ?? '')) return;
    event.preventDefault();
    endAutopilot();
    keysDown.add(code);
    refreshKeys();
  });
  on(window, 'keyup', event => {
    if (keysDown.delete(keyCodes[event.key.toLowerCase()])) refreshKeys();
  });
  on(window, 'blur', stopMovement);
  on(window, 'silent:archive-close', () => { previousTime = 0; startLoop(); });
  on(document, 'visibilitychange', () => {
    previousTime = 0;
    if (document.hidden) stopMovement();
    else {
      // RAF stops when an overlay is open; browsers may also suspend the
      // tab and lose a frame. Resume the orbit renderer on returning.
      startLoop();
    }
  });
  on(window,'focus',()=>{previousTime=0;startLoop()});
  on(root,'close',()=>{previousTime=0;startLoop()},true);

  for (const button of movementButtons) {
    on(button, 'pointerdown', event => {
      if (modalOpen() || autopilot?.phase === 'exit') return;
      endAutopilot();
      button.setPointerCapture(event.pointerId);
      touchDown.set(event.pointerId, button.dataset.move);
      refreshKeys();
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      on(button, type, event => {
        touchDown.delete(event.pointerId);
        refreshKeys();
      });
    }
  }

  for (const button of planetButtons) {
    on(button, 'click', () => startAutopilot(button.dataset.planet));
  }
  for (const button of destinations) on(button, 'click', () => startAutopilot(button.dataset.go));
  on(cancelButton, 'click', () => { endAutopilot(); render(); });
  on(graph, 'click', () => {
    chartCanvas.hidden = !chartCanvas.hidden;
    graph.setAttribute('aria-pressed', String(!chartCanvas.hidden));
    graph.querySelector('span').textContent = chartCanvas.hidden ? 'OFF' : 'ON';
    render();
  });
  // Orbital archive is opt-in: never display on initial load or auto-flight.
  const inspectVoyager = () => {
    if (modalOpen() || autopilot) return;
    stopMovement();
    window.dispatchEvent(new CustomEvent('silent:inspect', {
      detail: { world: 'interstellar', id: 'voyager1' }
    }));
  };
  // The player's ship is a navigation sprite, not an archive trigger.
  // Only the separate Voyager probe opens the historical record.
  // The existing Voyager probe marker may also be used; no page is opened automatically.
  on(probe, 'click', inspectVoyager);
  on(record, 'close', startLoop);
  on(root, 'orbit:launch', startDeparture);
  on(root, 'space:closed', startLoop);
  on(record, 'click', event => {
    if (event.target !== record) return;
    const bounds = record.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) record.close();
  });
  if (document.fullscreenEnabled && stage.requestFullscreen) {
    fullscreen.hidden = false;
    on(fullscreen, 'click', async () => {
      updateReadout();
      try {
        if (document.fullscreenElement === stage) await document.exitFullscreen();
        else await stage.requestFullscreen();
      } catch {
        flightPanel.hidden = false;
        status.textContent = 'Full screen is unavailable in this browser view';
      }
    });
    on(document, 'fullscreenchange', () => {
      const active = document.fullscreenElement === stage;
      fullscreen.textContent = active ? 'Exit full screen' : 'Full screen';
      fullscreen.setAttribute('aria-pressed', String(active));
    });
  }
  const observer = new ResizeObserver(measure);
  observer.observe(stage);
  measure();
  updateReadout();
  startLoop();

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    stopMovement();
    listeners.abort();
    if (document.fullscreenElement === stage) document.exitFullscreen().catch(() => {});
  };
}
