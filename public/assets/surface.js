import { createLunarSurface } from './lunar-surface.js';

(() => {
  const root = document.getElementById('silent-legacy-outer-space');
  const surface = root.querySelector('.outer-surface');
  const terrain = root.querySelector('.outer-terrain');
  const ctx = terrain.getContext('2d');
  const guide = root.querySelector('.outer-field-guide');
  const status = root.querySelector('.outer-surface-status');
  const title = root.querySelector('#outer-surface-title');
  const returnButton = surface.querySelector('.outer-return');
  const artifact = root.querySelector('.outer-artifact');
  const lunarControls = surface.querySelector('.outer-lunar-controls');
  const scan = artifact.querySelector('.outer-artifact-scan');
  const scanProgress = scan.querySelector('progress');
  const scanStatus = scan.querySelector('.outer-scan-status');
  const scanButton = scan.querySelector('.outer-scan-button');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const descentDuration = 1500;
  const slideDuration = 920;
  const launchDuration = 1550;
  const worlds = {
    moon: {
      name: 'Moon', entry: 'Powered approach · Lunar horizon', entryDuration: 1200, arrival: 'Touchdown confirmed · Lunar surface',
      records: [
        ['eagle','Eagle Descent Stage','NASA · AS11-40-5927','The Apollo 11 lunar module’s descent stage remained at Tranquility Base after it served as the launch platform for the astronauts’ return to lunar orbit.','https://science.nasa.gov/earth/earth-observatory/apollo-11-landing-site-39408/'],
        ['rover','Apollo 15 Lunar Rover','NASA · AS15-88-11901','The first crewed lunar rover carried Apollo 15 astronauts across the Hadley–Apennine region. It was left at the landing site.','https://eol.jsc.nasa.gov/SearchPhotos/photo.pl?frame=11901&mission=AS15&roll=88'],
        ['surveyor','Surveyor 3','NASA · AS12-48-7134','The robotic lander touched down in the Ocean of Storms in 1967. Apollo 12 astronauts later visited it and brought back its television camera and other parts.','https://science.nasa.gov/resource/apollo-12-and-surveyor-3/'],
        ['alsep','Apollo 12 ALSEP','NASA · AS12-47-6918','Apollo 12 astronauts deployed a group of scientific instruments in the Ocean of Storms. The instruments sent measurements from the lunar surface after the crew left.','https://science.nasa.gov/resource/apollo-12-experiments-in-progress/'],
      ],
    },
    mars: {
      name: 'Mars', entry: 'Atmospheric entry · Heat shield active', entryDuration: 1500, arrival: 'Touchdown confirmed · Mars surface',
      sky: '#0a0c19', ridges: ['#32253a','#553342','#754334'], ground: ['#573637','#763f36','#8e4c3a','#a36042','#b5714e'],
      stone: ['#643d3c','#c17753','#dc9d70'],
      records: [
        ['sojourner','Sojourner','NASA / JPL · PIA00766','The first rover on Mars explored the area around the Pathfinder lander and analyzed nearby rocks.','https://science.nasa.gov/mission/mars-pathfinder/'],
        ['twins','Spirit & Opportunity','NASA / JPL-Caltech · Artist’s concept','The twin rovers explored separate regions of Mars and found evidence that water once shaped their terrain.','https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/'],
        ['ingenuity','Ingenuity','NASA / JPL-Caltech / ASU / MSSS','Ingenuity made the first powered, controlled flight on another planet. Rotor damage during its 72nd flight ended the flight mission.','https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/'],
        ['phoenix','Phoenix','NASA / JPL-Caltech / University of Arizona · Artist’s concept','Phoenix used its robotic arm to dig into the northern plains and confirmed that there was water ice just beneath the surface.','https://science.nasa.gov/mission/mars-phoenix/'],
      ],
    },
  };
  const lunar = createLunarSurface(surface, terrain, artifact, worlds.moon.records, showArtifact);
  const marsField = surface.querySelector('.outer-mars-field');
  const marsSites = [[18,76,9],[35,61,7],[68,68,8],[83,80,11]];

  function paintTerrain(world) {
    if (!ctx) return;
    const { width, height } = terrain;
    const horizon = 137;
    ctx.fillStyle = world.sky;
    ctx.fillRect(0, 0, width, height);
    let seed = 1943;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let y = 10; y < horizon; y += 2) {
      ctx.fillStyle = `rgba(218,108,67,${((y / horizon) ** 2 * .54).toFixed(3)})`;
      ctx.fillRect(0, y, width, 2);
    }
    for (let i = 0; i < 43; i++) {
      ctx.fillStyle = i % 5 ? '#6c5d78' : '#c899a0';
      ctx.fillRect(Math.round(random() * width), Math.round(random() * 72), i % 7 ? 1 : 2, 1);
    }
    for (const [depth, color] of world.ridges.entries()) {
      ctx.fillStyle = color;
      for (let x = 0; x < width; x += 3) {
        const y = Math.round(horizon - 23 + depth * 8 - 5 * Math.sin(x * .029 + depth) - 8 * Math.sin(x * .015 + 1.8 * depth) - random() * 3);
        ctx.fillRect(x, y, 3, height - y);
      }
    }
    for (let y = horizon; y < height; y++) {
      const depth = (y - horizon) / (height - horizon);
      for (let x = 0; x < width; x += 4) {
        const relief = Math.sin(x * .031 + y * .074) * .47 + Math.sin(x * .07 - y * .14) * .34;
        const shade = Math.min(4, Math.max(0, Math.floor(depth * 4 + relief + .6)));
        ctx.fillStyle = world.ground[shade];
        ctx.fillRect(x, y, 4, 1);
      }
    }
    for (let i = 0; i < 660; i++) {
      const spread = random();
      const y = Math.round(horizon + spread * (height - horizon));
      ctx.fillStyle = world.stone[i % world.stone.length];
      ctx.fillRect(Math.round(random() * width), y, 1 + Math.round(random() * spread * 8), 1 + Math.floor(spread * 2));
    }
    for (const [cx, cy, rx, ry] of [[84,174,23,5],[353,220,36,9],[52,245,38,8],[390,158,19,4]]) {
      for (let row = -ry; row <= ry; row++) {
        const span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (row / ry) ** 2)));
        ctx.fillStyle = row < 1 ? world.stone[0] : world.stone[1];
        ctx.fillRect(cx - span, cy + row, span * 2, 1);
      }
    }
  }

  let activeScan;
  let scanFrame = 0;

  function showArtifact([id, name, credit, caption, source], lunarIndex) {
    cancelAnimationFrame(scanFrame);
    activeScan = lunarIndex;
    scan.hidden = lunarIndex === undefined;
    scanProgress.hidden = true;
    scanStatus.textContent = lunar.isScanned(lunarIndex) ? 'Scan complete' : '';
    scanButton.textContent = lunar.isScanned(lunarIndex) ? 'Scan again' : 'Run scan';
    scanButton.disabled = false;
    artifact.querySelector('h2').textContent = name;
    const photo = artifact.querySelector('img');
    photo.src = `./assets/surface/${id}-nasa.webp`;
    photo.alt = name;
    artifact.querySelector('figcaption').textContent = credit;
    artifact.querySelector('.outer-artifact-copy').textContent = caption;
    artifact.querySelector('a').href = source;
    artifact.showModal();
  }

  scanButton.addEventListener('click', () => {
    const index = activeScan;
    scanButton.disabled = true;
    scanProgress.hidden = false;
    scanStatus.textContent = 'Scanning artifact…';
    const start = performance.now();
    function advance(now) {
      if (!artifact.open || activeScan !== index) return;
      scanProgress.value = reducedMotion.matches ? 1 : Math.min((now - start) / 1300, 1);
      if (scanProgress.value < 1) {
        scanFrame = requestAnimationFrame(advance);
        return;
      }
      lunar.markScanned(index);
      scanStatus.textContent = 'Scan complete';
      scanButton.textContent = 'Scan again';
      scanButton.disabled = false;
    }
    scanProgress.value = 0;
    scanFrame = requestAnimationFrame(advance);
  });
  artifact.addEventListener('close', () => { if (!artifact.open) cancelAnimationFrame(scanFrame); });

  let landingTimer;
  surface.style.setProperty('--launch-duration', `${launchDuration}ms`);

  function makeMarsArtifact(record, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-haspopup', 'dialog');
    const sprite = new Image();
    sprite.src = `./assets/surface/${record[0]}.webp`;
    sprite.alt = '';
    button.append(sprite, record[1]);
    button.addEventListener('click', () => showArtifact(record));
    const marker = button.cloneNode(true);
    const [x, y, scale] = marsSites[index];
    marker.className = 'outer-mars-marker';
    marker.setAttribute('aria-label', `Investigate ${record[1]}`);
    marker.replaceChildren(marker.firstElementChild);
    marker.style.cssText = `left:${x}%;top:${y}%;--marker-size:${scale}%`;
    marker.addEventListener('click', () => showArtifact(record));
    marsField.append(marker);
    return button;
  }

  returnButton.addEventListener('click', () => {
    if (surface.dataset.phase !== 'landed') return;
    const world = surface.dataset.world;
    returnButton.disabled = true;
    lunarControls.hidden = true;
    guide.hidden = true;
    marsField.hidden = true;

    function leaveSurface() {
      surface.dispatchEvent(new CustomEvent('orbit:launch', { detail: world }));
      surface.close();
    }

    function launchShip() {
      if (reducedMotion.matches) {
        leaveSurface();
        return;
      }
      surface.dataset.phase = 'launch';
      status.textContent = 'Lifting off';
      landingTimer = setTimeout(leaveSurface, launchDuration);
    }

    if (world === 'moon') {
      surface.dataset.phase = 'boarding';
      status.textContent = 'Returning to the spaceship';
      lunar.board(launchShip);
    } else {
      launchShip();
    }
  });

  surface.addEventListener('cancel', event => event.preventDefault());
  surface.addEventListener('orbit:land', ({ detail }) => {
    const world = worlds[detail];
    if (!world || surface.open) return;
    clearTimeout(landingTimer);
    if (detail === 'moon') {
      lunar.paint();
    } else {
      terrain.width = 440;
      terrain.height = 260;
      paintTerrain(world);
    }
    title.textContent = world.name;
    surface.dataset.world = detail;
    returnButton.disabled = true;
    guide.hidden = true;
    lunarControls.hidden = true;
    marsField.hidden = true;
    marsField.replaceChildren();
    guide.replaceChildren(...(detail === 'mars' ? world.records.map(makeMarsArtifact) : []));
    surface.style.setProperty('--entry-duration', `${world.entryDuration}ms`);
    surface.style.setProperty('--descent-duration', `${descentDuration}ms`);
    surface.style.setProperty('--slide-duration', `${slideDuration}ms`);
    surface.dataset.phase = 'entry';
    status.textContent = world.entry;
    surface.showModal();
    title.focus({ preventScroll: true });

    function finishLanding() {
      surface.dataset.phase = 'landed';
      status.textContent = world.arrival;
      returnButton.disabled = false;
      if (detail === 'moon') {
        lunarControls.hidden = false;
        lunar.start();
      } else {
        marsField.hidden = false;
        guide.hidden = false;
      }
    }

    if (reducedMotion.matches) {
      finishLanding();
      return;
    }
    landingTimer = setTimeout(() => {
      if (!surface.open) return;
      surface.dataset.phase = 'descent';
      status.textContent = `Descending to ${world.name}`;
      landingTimer = setTimeout(() => {
        if (!surface.open) return;
        surface.dataset.phase = 'slide';
        status.textContent = 'Sliding to a stop';
        landingTimer = setTimeout(() => { if (surface.open) finishLanding(); }, slideDuration);
      }, descentDuration);
    }, world.entryDuration);
  });
  surface.addEventListener('close', () => {
    if (surface.open) return;
    clearTimeout(landingTimer);
    lunar.stop();
  });
})();
