import { bindSurfaceDirectionPad } from './surfaceDirectionPad';
import {
  ASTRONAUT_ATLAS_URL,
  ASTRONAUT_ATLAS_FRAME_HEIGHT,
  ASTRONAUT_ATLAS_FRAME_WIDTH,
} from '../data/astronautSprite';
import {
  ASTRONAUT_HEIGHT_METERS,
  LUNAR_PIXELS_PER_METER,
  SURFACE_HEIGHTS_METERS,
  surfaceSpriteUrl,
} from '../data/surfaceScale';
import { EARTH_DAY_TEXTURE } from '../data/pixelEquipment';
import { siteFor } from '../data/missionSites';

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

// Anchors are equipment ground-contact points, not the center of a pasted image.
// Presentation dimensions use a common astronaut-sized meter scale.
const sites = [
  { id: 'eagle', x: 155, y: 418, heightMeters: SURFACE_HEIGHTS_METERS.eagle, widthFactor: 1 },
  { id: 'rover', x: 403, y: 437, heightMeters: SURFACE_HEIGHTS_METERS.rover, widthFactor: 1.45 },
  { id: 'surveyor', x: 676, y: 412, heightMeters: SURFACE_HEIGHTS_METERS.surveyor, widthFactor: 1 },
  { id: 'alsep', x: 835, y: 471, heightMeters: SURFACE_HEIGHTS_METERS.alsep, widthFactor: 1.65 },
];
const shipHatch = { x: 495, y: 350 };
// Interactive archive gallery: historical artifacts are displayed together for discovery.
// Their actual geographically separate resting sites remain documented in each archive.

const jumpDuration = .92;
const INSPECT_RANGE = 79;
const VISIBLE_STAR_HEIGHT = 213;

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
  let locationIndex = 0;
  const nav = surface.querySelector('.outer-site-nav');
  nav.hidden = true;
  const siteLabel = document.createElement('div');
  siteLabel.className = 'outer-site-detail';
  siteLabel.setAttribute('aria-live', 'polite');
  surface.append(siteLabel);
  // Every lunar artifact is available in the same explorable scene.
  const navButtons = [];
  const keys = new Set();
  const padKeys = new Set();
  const directionPad = bindSurfaceDirectionPad(surface, padKeys, {
    canMove: () => playable() && !archiveOpen(),
    onMove: () => { target = null; },
  });
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
  let crewEgress = null;
  let skyTime = 0;
  const astronaut = new Image();
  astronaut.decoding = 'async';
  on(astronaut, 'load', () => {
    if (surface.open && playable()) draw(true);
  });
  astronaut.src = ASTRONAUT_ATLAS_URL;

  const models = records.map(([id], index) => {
    const image = new Image();
    on(image, 'load', () => {
      if (!surface.open || surface.dataset.world !== 'moon') return;
      if (index === activeSite) paintPreview(index);
      if (surface.dataset.phase !== 'boarding') draw(playable());
    });
    image.onerror = () => {
      image.onerror = null;
      image.src = `https://raw.githubusercontent.com/sithuaunglife/the-silent-legacy/main/public/assets/surface/${id}.webp`;
    };
    image.src = surfaceSpriteUrl(id);
    return image;
  });

  const night = sky.createLinearGradient(0, 0, 0, HORIZON_Y);
  night.addColorStop(0, '#030915');
  night.addColorStop(.7, '#101729');
  night.addColorStop(1, '#2b3449');
  sky.fillStyle = night;
  sky.fillRect(0, 0, 960, HORIZON_Y);
  for (const { x, h } of mountainHeights) {
    sky.fillStyle = '#252d3c';
    sky.fillRect(x, HORIZON_Y - Math.round(h), 6, Math.ceil(h));
    const foreground = Math.round(h * .63 + Math.sin(x * .018) * 11);
    sky.fillStyle = '#3c4556';
    sky.fillRect(x, HORIZON_Y - foreground, 6, foreground);
  }
  paintLunarGround();

  // A borderless globe, lit volumetrically and mapped from the bundled Earth
  // day texture. Neither a rectangular backing nor a circle stroke is drawn.
  const earthSprite = document.createElement('canvas');
  earthSprite.width = earthSprite.height = 116;
  const earthPixels = earthSprite.getContext('2d', { willReadFrequently: true });
  function renderGlobe(texturePixels) {
    const size = earthSprite.width;
    const radius = size * .488;
    const result = earthPixels.createImageData(size, size);
    const data = result.data;
    for (let py=0; py<size; py++) {
      for (let px=0; px<size; px++) {
        const nx=(px + .5 - size/2)/radius;
        const ny=(py + .5 - size/2)/radius;
        const rr=nx*nx+ny*ny;
        if(rr>=1) continue;
        const nz=Math.sqrt(1-rr);
        const longitude=Math.atan2(nx,nz) / (2*Math.PI);
        const latitude=Math.asin(ny) / Math.PI;
        // Shift Earth texture until Africa / Atlantic face the lunar observer.
        const u=((longitude+.60)%1+1)%1;
        const v=Math.min(.999,Math.max(0,.5+latitude));
        const base=texturePixels ?
          (()=>{const tx=Math.floor(u*texturePixels.width),ty=Math.floor(v*texturePixels.height);
            const i=(ty*texturePixels.width+tx)*4;
            return [texturePixels.data[i],texturePixels.data[i+1],texturePixels.data[i+2]];})() :
          ((Math.sin(u*35)+Math.cos(v*31+u*14)>0.48)?[69,149,95]:[35,107,183]);
        const light=Math.min(1,Math.max(.16,.15+.88*Math.max(0,nz*.84-nx*.44-ny*.12)));
        const atmosphere=Math.pow(1-Math.min(1,nz),3)*20;
        const i=(py*size+px)*4;
        data[i]=Math.min(255,base[0]*light+atmosphere*.25);
        data[i+1]=Math.min(255,base[1]*light+atmosphere*.6);
        data[i+2]=Math.min(255,base[2]*light+atmosphere*1.6);
        data[i+3]=255;
      }
    }
    earthPixels.clearRect(0,0,size,size);
    earthPixels.putImageData(result,0,0);
  }
  renderGlobe();
  const earthTexture = new Image();
  earthTexture.decoding='async';
  on(earthTexture, 'load', () => {
    const source = document.createElement('canvas');
    source.width = earthTexture.naturalWidth;
    source.height = earthTexture.naturalHeight;
    const tx=source.getContext('2d',{willReadFrequently:true});
    tx.drawImage(earthTexture,0,0);
    const image=tx.getImageData(0,0,source.width,source.height);
    renderGlobe(image);
    if(playable()) draw(true);
  });
  earthTexture.src=EARTH_DAY_TEXTURE;
  const earthGlow = document.createElement('canvas');
  earthGlow.width=earthGlow.height=160;
  const gctx=earthGlow.getContext('2d');
  const bloom=gctx.createRadialGradient(80,80,31,80,80,79);
  bloom.addColorStop(0,'#407cb511');
  bloom.addColorStop(.55,'#3567a418');
  bloom.addColorStop(1,'#3267a400');
  gctx.fillStyle=bloom;
  gctx.fillRect(0,0,160,160);

  function paintAnimatedSky() {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 960, VISIBLE_STAR_HEIGHT);
    ctx.clip();
    const t = reducedMotion.matches ? 0 : skyTime;
    for (const [index, star] of stars.entries()) {
      const drift = .15 + (index % 6) * .125;
      const sx = Math.round((star.x + t * drift) % 960);
      const sy = Math.round((star.y % VISIBLE_STAR_HEIGHT + t * drift * .22) % VISIBLE_STAR_HEIGHT);
      const alpha = (.55 + .28 * Math.sin(t * (.7 + index % 4 * .13) + index)) * star.bright;
      ctx.fillStyle = `rgba(198, 222, 255, ${alpha.toFixed(2)})`;
      ctx.fillRect(sx, sy, star.size, star.size);
      if (index % 26 === 0) {
        ctx.fillRect(sx - 2, sy, 5, 1);
        ctx.fillRect(sx, sy - 2, 1, 5);
      }
    }
    // Earthrise: a naturally circular sphere, with no hard square or outline.
    const earthBob = reducedMotion.matches ? 0 : Math.round(Math.sin(t*.075));
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(earthGlow, 755, 39 + earthBob, 158, 158);
    ctx.drawImage(earthSprite, 780, 64 + earthBob, 108, 108);
    ctx.restore();
  }

  function siteDimensions(index, depthScale) {
    const model = models[index];
    const site = sites[index];
    const height = Math.max(9, Math.round(site.heightMeters * LUNAR_PIXELS_PER_METER * depthScale));
    const aspect = model?.naturalHeight ? model.naturalWidth / model.naturalHeight : 1.1;
    return { height, width: Math.round(height * aspect * (site.widthFactor || 1)) };
  }

  function drawModel(context, index, x, y, width, height) {
    const model = models[index];
    if (!model?.complete || !model.naturalWidth) return;
    const drawHeight = height ?? Math.round(width * model.naturalHeight / model.naturalWidth);
    context.imageSmoothingEnabled = false;
    context.drawImage(model, Math.round(x - width / 2), Math.round(y - drawHeight), Math.round(width), Math.round(drawHeight));
  }

  /** Pixelated occlusion, rubble and a contact shadow physically join a model to the ground. */
  function drawGroundContact(x, y, width, depth) {
    const shadowWidth = Math.max(15, Math.min(152, width * .82));
    ctx.save();
    ctx.fillStyle = '#1118276e';
    ctx.beginPath();
    ctx.ellipse(Math.round(x) + 4, y + 1, shadowWidth * .57, Math.max(3, depth * 5), -.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b243460';
    ctx.fillRect(Math.round(x - shadowWidth * .30), y + 2, Math.round(shadowWidth * .6), 2);
    ctx.restore();
  }

  function drawSurfaceDust(x, y, width) {
    const tiles = Math.min(14, Math.max(4, Math.round(width / 13)));
    for (let i = 0; i < tiles; i += 1) {
      const dx = (i - (tiles - 1) / 2) * width / tiles;
      const dy = Math.round(Math.sin(i * 2.4) * 2);
      ctx.fillStyle = i % 3 ? '#737f96' : '#45536b';
      ctx.fillRect(Math.round(x + dx), y - 1 + dy, i % 3 === 0 ? 3 : 5, 2);
    }
  }

  function drawUserAstronaut(point, player) {
    const leap = jumpHeight();
    const height = Math.round(ASTRONAUT_HEIGHT_METERS * LUNAR_PIXELS_PER_METER * point.scale);
    const width = Math.round(height * ASTRONAUT_ATLAS_FRAME_WIDTH / ASTRONAUT_ATLAS_FRAME_HEIGHT);
    const groundX = Math.round(point.x);
    const groundY = Math.round(player.y);
    drawGroundContact(groundX, groundY, width * 0.77, point.scale);
    if (!astronaut.complete || !astronaut.naturalWidth) return;
    const walkingFrame = player.step ? 1 + Math.floor(player.step / 5) % 3 : 0;
    const frameIndex = reducedMotion.matches ? 0 : walkingFrame;
    const y = groundY - leap - (walkingFrame && !reducedMotion.matches ? Math.round(Math.abs(Math.sin(player.step / 7))) : 0);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // Keep the user's exact face, suit, flag and four pixel-animation poses.
    ctx.translate(groundX, 0);
    ctx.scale(player.facing < 0 ? -1 : 1, 1);
    ctx.drawImage(
      astronaut,
      frameIndex * ASTRONAUT_ATLAS_FRAME_WIDTH, 0,
      ASTRONAUT_ATLAS_FRAME_WIDTH, ASTRONAUT_ATLAS_FRAME_HEIGHT,
      -width / 2, y - height, width, height,
    );
    ctx.restore();
  }

  function groundPoint({ x, y }) {
    const depth = clamp((y - HORIZON_Y) / (540 - HORIZON_Y), 0, 1);
    return { x: 480 + (x - 480) * (.73 + depth * .27), y, scale: .66 + depth * .56 };
  }

  function paintLunarGround() {
    rock.clearRect(0, 0, 960, 540);
    const site = siteFor(sites[locationIndex].id);
    const shades = site.style === 'rille' ? ['#2a3244','#374459','#4a576c','#5c687f','#737d91','#8991a2'] :
      site.style === 'crater' ? ['#2e354a','#3a455a','#48546c','#59657c','#647389','#78879a'] :
      site.style === 'experiment' ? ['#34394b','#42495b','#4c5a70','#646d81','#7a8394','#8d94a4'] :
      ['#272f43','#364154','#454e62','#545e72','#626e82','#747f90'];
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
    // Elliptical isometric basins: layered rim highlights, shadowed inner walls,
    // and an offset depressed floor create depth instead of flat dark ovals.
    const basins = [
      ...(site.style === 'rille' ? [
        {x:90,y:496,rx:38,ry:9},{x:755,y:472,rx:26,ry:8}]:
        site.style === 'crater' ? [{x:510,y:431,rx:200,ry:42},{x:120,y:499,rx:60,ry:14}]:
        site.style === 'experiment' ? [{x:170,y:405,rx:70,ry:16},{x:760,y:340,rx:32,ry:7}]:
        [{x:215,y:438,rx:54,ry:10},{x:730,y:484,rx:74,ry:17}]),
      {x: 430, y: 324, rx: 23, ry: 7}, {x: 596, y: 486, rx: 31, ry: 8},
      {x: 890, y: 510, rx: 38, ry: 12}, {x: 345, y: 397, rx: 19, ry: 5},
      {x: 540, y: 427, rx: 29, ry: 8}, {x: 90, y: 420, rx: 19, ry: 5},
    ];
    for (const crater of basins) {
      const {x, y, scale} = groundPoint(crater);
      const rx = Math.max(8, crater.rx * scale), ry = Math.max(3, crater.ry * scale);
      for (let row = -Math.ceil(ry + 5); row <= Math.ceil(ry + 5); row += 1) {
        const normalized = (row + 0.5) / (ry + 4);
        const span = Math.round(rx * 1.09 * Math.sqrt(Math.max(0, 1 - normalized * normalized)));
        if (!span) continue;
        rock.fillStyle = row < -ry * .45 ? '#9aa5b9' : row < 0 ? '#79849c' : '#353c50';
        rock.fillRect(Math.round(x - span), Math.round(y + row), span * 2, 1);
      }
      for (let row = -Math.ceil(ry * .76); row <= Math.ceil(ry * .76); row += 1) {
        const normalized = row / (ry * .78);
        const span = Math.floor(rx * .84 * Math.sqrt(Math.max(0, 1 - normalized * normalized)));
        if (!span) continue;
        rock.fillStyle = row < -ry * .19 ? '#202a3c' : row < ry * .38 ? '#2c3448' : '#526177';
        rock.fillRect(Math.round(x - span + 2), Math.round(y + row + 2), span * 2, 1);
      }
      // Crescent-shaped sunward rim and dark far wall, with loose regolith.
      rock.fillStyle = '#b0b9ca';
      rock.fillRect(Math.round(x - rx * .58), Math.round(y - ry - 3), Math.round(rx * 1.1), 2);
      rock.fillStyle = '#172236';
      rock.fillRect(Math.round(x - rx * .42), Math.round(y + ry + 2), Math.round(rx * .83), 2);
      for (let n = 0; n < 6; n++) {
        rock.fillStyle = n % 2 ? '#8994a9' : '#343d53';
        const angle = n * 2.39;
        rock.fillRect(Math.round(x + Math.cos(angle) * rx * 1.25), Math.round(y + Math.sin(angle) * ry * 2), 3, 2);
      }
    }
    // Layered escarpments, dark rock faces, scattered regolith and distinct
    // illumination planes. Pixel geometry gives 2.5D depth with no blur.
    const reliefRocks = [
      [52,398,12],[251,424,7],[470,472,14],[552,323,8],
      [720,388,12],[921,445,19],[331,520,11],[578,510,6],
      [93,345,7],[863,373,6],[607,405,10],[234,475,8],
      [428,368,8],[794,505,10],[70,515,12],[688,525,8],
    ];
    const drawRock = (x,y,size,index) => {
      const width=Math.round(size), height=Math.round(size*.48);
      const left=Math.round(x-width), right=Math.round(x+width);
      const tipY=Math.round(y-height*1.7);
      rock.fillStyle='#212c3da8';
      rock.fillRect(left+7,Math.round(y+3),width*2,Math.max(2,Math.round(height*.4)));
      rock.beginPath();
      rock.moveTo(left,Math.round(y));rock.lineTo(Math.round(x-width*.32),tipY);
      rock.lineTo(right-2,Math.round(y-height*.28));rock.lineTo(right,Math.round(y));rock.closePath();
      rock.fillStyle=index%3===0?'#747e97':'#5c697e';rock.fill();
      rock.beginPath();
      rock.moveTo(left,Math.round(y));rock.lineTo(Math.round(x-width*.32),tipY);
      rock.lineTo(Math.round(x-width*.12),Math.round(y-height*.18));rock.closePath();
      rock.fillStyle='#aeb7c7';rock.fill();
      rock.fillStyle='#303b51';
      rock.fillRect(Math.round(x+width*.25),Math.round(y-height*.12),Math.max(3,Math.round(width*.72)),3);
    };
    reliefRocks.forEach(([x,y,size],index)=>drawRock(x,y,size,index));
    // Fine relief pass: small impact pits, radial ejecta and angular shattered
    // fragments. All fixed geometry is generated once on ground canvas.
    for (let i=0; i<42; i++) {
      const x = 26 + (i * 173 + i * i * 11) % 908;
      const y = 312 + (i * 59 + i * i * 7) % 208;
      const radius = 3 + i % 5;
      rock.fillStyle = '#a4aec0';
      rock.fillRect(x - radius, y - 2, radius * 2, 2);
      rock.fillStyle = '#283248';
      rock.fillRect(x - radius + 1, y, radius * 2 - 2, 3);
      rock.fillStyle = '#626f86';
      rock.fillRect(x - radius + 3, y + 3, Math.max(2, radius * 2 - 6), 2);
      if (i % 3 === 0) {
        rock.fillStyle = '#9faab9';
        rock.fillRect(x - radius - 6, y - 3, 3, 1);
        rock.fillRect(x + radius + 3, y + 1, 4, 1);
      }
    }
    // Impact-shattered basalt: sunlit upper facet, dark lower face and
    // a separate crisp shadow to establish the surface elevation.
    for (let i=0; i<33; i++) {
      const x=17+(i*139+i*i*13)%927;
      const y=331+(i*71+i*i*3)%190;
      const w=4+(i%5)*2, h=2+(i%4);
      rock.fillStyle='#18233882';rock.fillRect(x+3,y+3,w+3,2);
      rock.fillStyle=i%2?'#8a97aa':'#67768e';
      rock.beginPath();rock.moveTo(x,y);rock.lineTo(x+3,y-h);rock.lineTo(x+w,y-h-1);
      rock.lineTo(x+w+2,y+1);rock.closePath();rock.fill();
      rock.fillStyle='#b7c2cd';rock.fillRect(x+3,y-h,Math.max(2,w-4),1);
      rock.fillStyle='#303c53';rock.fillRect(x+w-2,y-1,3,3);
    }
    // Parallel rover tire ridges across the foreground, with a broken
    // returning track so the surface looks visited rather than decorative.
    for (let row=0; row<2; row++) {
      for(let step=0; step<19; step++) {
        const x=303+step*11, y=465+row*7+Math.round(Math.sin(step*.38)*7);
        rock.fillStyle=row?'#374358':'#929aaa';
        rock.fillRect(x,y,6,1);rock.fillRect(x+3,y+2,3,1);
      }
    }
    // Site-specific geology; drawings are 2.5D illustrations, not claimed to be
    // surveyed elevation maps of the resting sites.
    if(site.style === 'rille') {
      // The Hadley Rille escarpment cuts a dark channel across the foreground.
      rock.fillStyle='#19283c';
      rock.beginPath();rock.moveTo(0,490);rock.lineTo(135,478);
      rock.lineTo(210,496);rock.lineTo(350,540);rock.lineTo(0,540);rock.fill();
      rock.strokeStyle='#b4bac3';rock.lineWidth=3;
      rock.beginPath();rock.moveTo(0,486);rock.lineTo(135,474);rock.lineTo(210,492);rock.stroke();
    } else if(site.style === 'crater') {
      rock.strokeStyle='#a7abb4';rock.lineWidth=4;
      rock.beginPath();rock.ellipse(500,429,196,39,0,Math.PI*.1,Math.PI*.94);rock.stroke();
    } else if(site.style === 'experiment') {
      // Apollo ALSEP central distribution station cable routes.
      rock.strokeStyle='#202b3d';rock.lineWidth=2;
      for (let n=0;n<3;n++) {
        rock.beginPath();rock.moveTo(487,425);
        rock.bezierCurveTo(375+n*75,475,260+n*150,422,210+n*260,482);rock.stroke();
      }
    }
    // Equipment-specific surface history: landing scars and wheel tracks. These
    // remain behind the physical machinery, helping the sprites feel planted.
    if (site.style === 'rille') for(let n=0;n<2;n++){
      rock.strokeStyle=n?'#354052a8':'#9fa8b581';rock.lineWidth=2;
      rock.beginPath();
      rock.moveTo(345-70,485-11+n*11);
      rock.bezierCurveTo(300,472+n*8,365,491+n*10,421,512+n*10);
      rock.stroke();
    }
    // Apollo descent-blast footprint and instruments connected by fine cables.
    rock.strokeStyle='#242d44b7';rock.lineWidth=1;
    rock.beginPath();rock.ellipse(155,422,63,14,-.11,0,Math.PI*2);rock.stroke();
    rock.strokeStyle='#939caf';
    rock.beginPath();rock.moveTo(785,406);rock.lineTo(807,420);rock.lineTo(839,418);rock.stroke();
  }

  function paintPreview(index) {
    preview.clearRect(0, 0, 44, 44);
    drawModel(preview, index, 22, 38, 36);
  }

  function draw(showPlayer) {
    ctx.drawImage(background, 0, 0);
    paintAnimatedSky();
    const profile = siteFor(sites[locationIndex].id);
    if (profile.style === 'rille') {
      ctx.fillStyle='#2d364b';
      ctx.beginPath();ctx.moveTo(0,285);ctx.lineTo(30,257);ctx.lineTo(98,235);
      ctx.lineTo(160,205);ctx.lineTo(230,239);ctx.lineTo(290,224);
      ctx.lineTo(356,258);ctx.lineTo(500,287);ctx.lineTo(960,290);ctx.closePath();ctx.fill();
      ctx.fillStyle='#707b91';ctx.fillRect(96,233,67,3);
    }
    if (profile.style === 'crater') {
      ctx.fillStyle='#485267';ctx.fillRect(48,269,250,4);
      ctx.fillStyle='#29364c';ctx.fillRect(42,273,260,10);
    }
    ctx.drawImage(ground, 0, 0);
    const entities = sites.map((site, index) => ({ y: site.y, paint: () => {
      const point = groundPoint(site);
      const {width, height} = siteDimensions(index, point.scale);
      drawGroundContact(point.x, site.y, width, point.scale);
      drawModel(ctx, index, point.x, site.y, width, height);
      drawSurfaceDust(point.x, site.y, width);
      // Foreground regolith specks occlude the foot of each object slightly.
      ctx.fillStyle='#a3b0c0';
      ctx.fillRect(Math.round(point.x-width*.24),site.y-1,3,2);
      ctx.fillStyle='#2d3850';
      ctx.fillRect(Math.round(point.x+width*.18),site.y+1,5,2);
      if (showPlayer && !boarding && activeSite === index) {
        ctx.fillStyle = scanned.has(index) ? '#8dcdaa9e' : '#94d0f99e';
        ctx.fillRect(Math.round(point.x - 10), site.y + 5, 20, 2);
      }
    } }));
    if (showPlayer) {
      if (target) {
        const point = groundPoint(target);
        ctx.strokeStyle = '#a0d4ff';
        ctx.strokeRect(Math.round(point.x) - 5, point.y - 3, 10, 6);
      }
      entities.push({ y: player.y, paint: () => {
        drawUserAstronaut(groundPoint(player), player);
      } });
    }
    entities.sort((first, second) => first.y - second.y);
    for (const entity of entities) entity.paint();
  }

  // A contextual INSPECT button appears alongside a machine only when the
  // astronaut reaches that machine. No persistent bottom-center inspector.
  function selectNearest() {
    let nearest = undefined;
    let distance = INSPECT_RANGE;
    for (const [index, site] of sites.entries()) {
      const range = Math.hypot(player.x - site.x, (player.y - site.y) * 1.1);
      if (range < distance) { nearest = index; distance = range; }
    }
    if (nearest === undefined) {
      card.hidden = true;
      activeSite = undefined;
      return;
    }
    const site = sites[nearest];
    const point = groundPoint(site);
    const dimensions = siteDimensions(nearest, point.scale);
    const toLeft = point.x > 650;
    const buttonX = toLeft ? point.x - dimensions.width * .55 - 8 : point.x + dimensions.width * .50 + 8;
    card.style.left = `${clamp(buttonX / 960 * 100, 3, 84)}%`;
    card.style.top = `${clamp((site.y - Math.min(dimensions.height * .65, 80)) / 540 * 100, 16, 85)}%`;
    card.style.transform = 'translateY(-50%)';
    card.dataset.side = toLeft ? 'left' : 'right';
    card.hidden = false;
    if (nearest !== activeSite) {
      activeSite = nearest;
      cardTitle.textContent = records[nearest][1];
      paintPreview(nearest);
    }
  }

  function investigate(index) {
    if (!playable() || index === undefined) return;
    const site=sites[index];
    if (Math.hypot(player.x - site.x, (player.y - site.y) * 1.1) >= INSPECT_RANGE) return;
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
    if (!playable() && !boarding && !crewEgress) return;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, .05) : 0;
    lastTime = now;
    if (!reducedMotion.matches) skyTime += dt;
    if (crewEgress) {
      crewEgress.time += dt;
      const u = Math.min(1, crewEgress.time / crewEgress.duration);
      const smooth = u * u * (3 - 2 * u);
      player.x = crewEgress.startX + (crewEgress.endX - crewEgress.startX) * smooth;
      player.y = crewEgress.startY + (crewEgress.endY - crewEgress.startY) * smooth;
      player.step += dt * 55;
      draw(true);
      if (u >= 1) {
        const done = crewEgress.done;
        crewEgress = null;
        player.step = 0;
        done();
      }
      frame = requestAnimationFrame(tick);
      return;
    }
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
      for (const key of [...keys, ...padKeys]) {
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
          // Arriving reveals the nearby INSPECT button; it never opens automatically.
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
    directionPad.reset();
    target = null;
    boarding = null;
    crewEgress = null;
  }

  on(window, 'keydown', event => {
    if (!playable() || archiveOpen() || event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.code === 'Space') {
      event.preventDefault();
      if (!event.repeat) jump();
      return;
    }
    if (event.code === 'KeyE' && !event.repeat && activeSite !== undefined) { event.preventDefault(); investigate(activeSite); }
    if (directions[event.code] || event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      event.preventDefault();
      keys.add(event.code);
    }
  });
  on(window, 'keyup', event => keys.delete(event.code));
  on(window, 'blur', () => keys.clear());
  on(jumpButton, 'click', jump);
  on(card, 'click', () => { if (activeSite !== undefined) investigate(activeSite); });
  on(terrain, 'click', event => {
    if (!playable() || archiveOpen()) return;
    const box = terrain.getBoundingClientRect();
    const x = (event.clientX - box.left) * terrain.width / box.width;
    const y = (event.clientY - box.top) * terrain.height / box.height;
    const index = sites.findIndex((site, index) => {
      const image = models[index];
      const point = groundPoint(site);
      const {width, height} = siteDimensions(index, point.scale);
      // Selection tolerances are larger than tiny archaeological models.
      return Math.abs(point.x - x) < Math.max(23, width / 2) &&
        y > site.y - Math.max(36, height) - 8 && y < site.y + 16;
    });
    if (index !== -1) {
      const site = sites[index];
      // Click-to-walk to equipment. Inspection is a separate near-range action.
      target = { x: site.x + (player.x > site.x ? 28 : -28), y: clamp(site.y + (player.y > site.y ? 14 : -14), GROUND_MIN_Y, GROUND_MAX_Y) };
    } else if (y >= HORIZON_Y) {
      const groundY = clamp(y, GROUND_MIN_Y, GROUND_MAX_Y);
      const horizontalScale = (groundPoint({ x: 960, y: groundY }).x - 480) / 480;
      target = { x: clamp(480 + (x - 480) / horizontalScale, 25, 935), y: groundY };
    }
  });

  function updateSiteLabel() {
    siteLabel.textContent = 'Illustrative artifact gallery — original equipment remains at separate NASA mission sites.';
  }
  function updateCount() {
    count.textContent = `Artifacts scanned ${scanned.size}/${sites.length}`;
  }

  return {
    paint() {
      stop();
      terrain.width = 960;
      terrain.height = 540;
      locationIndex = 0;
      nav.hidden = true;siteLabel.hidden=true;
      navButtons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===0)));
      updateSiteLabel();
      paintLunarGround();
      draw(false);
    },
    egress(done) {
      // The hatch is near the landed ship's center; astronaut walks out instead
      // of appearing instantly at the remote exploration starting location.
      stop();
      Object.assign(player, {x: shipHatch.x + 4, y: shipHatch.y + 6, facing: 1, step: 0, jumpTime: 0});
      activeSite = undefined;
      card.hidden = true;
      updateCount();
      draw(true);
      if (reducedMotion.matches) {
        player.x = 680;player.y = 458;
        draw(true);
        done();
        frame = requestAnimationFrame(tick);
        return;
      }
      crewEgress = {startX:player.x,startY:player.y,endX:680,endY:458,time:0,duration:2.05,done};
      frame = requestAnimationFrame(tick);
    },
    start() {
      Object.assign(player, { x: 680, y: 458, facing: -1, step: 0, jumpTime: 0 });
      nav.hidden = true;siteLabel.hidden=true;
      updateSiteLabel();
      activeSite = undefined;
      card.hidden=true;
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
    destroy() { stop(); directionPad.destroy(); listeners.abort();siteLabel.remove();nav.replaceChildren(); },
    isScanned: index => scanned.has(index),
    markScanned(index) {
      scanned.add(index);
      updateCount();
    },
  };
}
