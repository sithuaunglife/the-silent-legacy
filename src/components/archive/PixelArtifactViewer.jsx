import React, { useEffect, useRef, useState } from 'react';
import { ASTRONAUT_ATLAS_URL } from '../../data/astronautSprite';
import { ASTRONAUT_HEIGHT_METERS, SURFACE_HEIGHTS_METERS, surfaceSpriteUrl } from '../../data/surfaceScale';

// The mission's existing hand-drawn 2.5D sprite is the subject; a low-resolution
// canvas supplies the matching Moon/Mars terrain, rather than a rotating 3D mesh.
const FALLBACK_SURFACE = {
  eagle: 'eagle', apollo15_lrv: 'rover', surveyor3: 'surveyor',
  spirit: 'twins', opportunity: 'twins', sojourner: 'sojourner',
  alsep: 'alsep', ingenuity: 'ingenuity', phoenix: 'phoenix',
};
const SOURCE_BASE = 'https://raw.githubusercontent.com/sithuaunglife/the-silent-legacy/main/public/assets/surface/';
export const assetUrl = (path) => surfaceSpriteUrl(path);
export const archiveAssetFallback = (path) => `${SOURCE_BASE}${path}.webp`;

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
function polygon(ctx, points, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
function drawWorld(ctx, world) {
  const martian = world === 'MARS';
  const palette = martian ? {
    sky: '#150f1b', glow: '#5b2630', distant: '#633247',
    distant2: '#8b3c43', upper: '#9d5047', front: '#5a2c37',
    side: '#773b40', ridge: '#b96c52', grain: '#d17c5e',
    rock: '#b8775e', shadow: '#3b2332', highlight: '#f3ab76',
  } : {
    sky: '#050d1d', glow: '#111f3b', distant: '#293750',
    distant2: '#495770', upper: '#6d7189', front: '#393e57',
    side: '#50576c', ridge: '#a1a8b5', grain: '#bec4cf',
    rock: '#adb5c4', shadow: '#20283e', highlight: '#d9e2ed',
  };
  const rand = seeded(martian ? 34054 : 1969);
  ctx.clearRect(0, 0, 480, 300);
  ctx.fillStyle = palette.sky;
  ctx.fillRect(0, 0, 480, 300);
  for (let y = 10; y < 195; y += 7) {
    ctx.globalAlpha = Math.min(0.45, y / 620);
    ctx.fillStyle = palette.glow;
    ctx.fillRect(0, y, 480, 7);
  }
  ctx.globalAlpha = 1;
  for (let n = 0; n < 44; n += 1) {
    const x = rand() * 480;
    const y = rand() * 155;
    ctx.fillStyle = n % 6 ? '#5c7196' : '#afd4e8';
    ctx.fillRect(x | 0, y | 0, n % 5 ? 1 : 2, 1);
  }
  polygon(ctx, [[0, 180], [25, 166], [53, 171], [83, 146], [110, 169], [151, 151], [187, 177], [241, 150], [270, 170], [312, 148], [353, 173], [406, 137], [445, 168], [480, 148], [480, 300], [0, 300]], palette.distant);
  polygon(ctx, [[0, 205], [30, 189], [70, 193], [109, 178], [142, 191], [180, 179], [219, 193], [270, 174], [328, 189], [363, 170], [417, 188], [458, 176], [480, 196], [480, 300], [0, 300]], palette.distant2);
  // The layered isometric landing shelf creates real visual depth beneath the sprite.
  polygon(ctx, [[14, 211], [220, 169], [464, 210], [266, 259]], palette.ridge);
  polygon(ctx, [[14, 211], [266, 259], [266, 300], [14, 257]], palette.front);
  polygon(ctx, [[266, 259], [464, 210], [464, 255], [266, 300]], palette.side);
  polygon(ctx, [[19, 208], [220, 174], [457, 211], [265, 254]], palette.upper);
  // Low-resolution faceted strata and scattered rocks reinforce pixel-game art direction.
  for (let i = 0; i < 110; i += 1) {
    const x = 27 + rand() * 423;
    const y = 197 + rand() * 46;
    if (Math.abs(x - 240) > 125 || rand() > 0.64) {
      ctx.globalAlpha = .13 + rand() * .2;
      ctx.fillStyle = rand() > .5 ? palette.highlight : palette.shadow;
      ctx.fillRect(x | 0, y | 0, 1 + (rand() * 4 | 0), 1 + (rand() * 2 | 0));
    }
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 16; i += 1) {
    const x = (rand() * 390 + 32) | 0;
    const y = (190 + rand() * 53) | 0;
    if (x > 145 && x < 330 && y < 235) continue;
    const size = (3 + rand() * 8) | 0;
    ellipse(ctx, x + 2, y + size / 2, size, 2.5, palette.shadow);
    polygon(ctx, [[x - size, y], [x - 1, y - size * .75], [x + size, y - 1], [x + size * .5, y + size * .3]], palette.rock);
    polygon(ctx, [[x - size, y], [x - 1, y - size * .75], [x, y], [x - 1, y + 1]], palette.highlight);
  }
  // Dust-layer and rim below the foot of the equipment.
  ellipse(ctx, 245, 246, 95, 13, martian ? '#4b2c3d' : '#363c52');
  ctx.strokeStyle = palette.highlight;
  ctx.globalAlpha = .4;
  ctx.beginPath();
  ctx.moveTo(20, 210);
  ctx.lineTo(221, 174);
  ctx.lineTo(458, 211);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** Single-equipment 2.5D pixel diorama, not a falsely labelled 360°/NASA 3D scan. */
export default function PixelArtifactViewer({ craft }) {
  const canvasRef = useRef(null);
  const [zoomed, setZoomed] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const world = craft.world === 'MARS' ? 'MARS' : 'MOON';
  const surface = craft.surfaceId || FALLBACK_SURFACE[craft.id] || '';
  const equipmentMeters = SURFACE_HEIGHTS_METERS[surface] || ASTRONAUT_HEIGHT_METERS;
  const artHeightPercent = Math.min(74, equipmentMeters / ASTRONAUT_HEIGHT_METERS * 33);
  useEffect(() => {
    setZoomed(false);
    setImageSrc(surface ? assetUrl(surface) : '');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: false });
    if (context) drawWorld(context, world);
  }, [craft.id, surface, world]);
  const onImageError = () => {
    if (imageSrc !== archiveAssetFallback(surface)) setImageSrc(archiveAssetFallback(surface));
  };
  return <div className={`pixel-diorama ${world === 'MARS' ? 'pixel-diorama-mars' : 'pixel-diorama-moon'}`}>
    <canvas ref={canvasRef} width="480" height="300" aria-hidden="true" className="pixel-diorama-land" />
    <div className="pixel-diorama-topline"><span>◈ 2.5D PIXEL ARTIFACT</span><span>{world} / SURFACE</span></div>
    <div className="pixel-diorama-shadow" aria-hidden="true" />
    <div className="pixel-diorama-human" aria-label={`Astronaut ${ASTRONAUT_HEIGHT_METERS} meters tall for comparison`}>
      <span className="pixel-diorama-human-art" style={{ backgroundImage: `url("${ASTRONAUT_ATLAS_URL}")` }} />
      <span className="pixel-diorama-human-label">1.75 m</span>
    </div>
    {imageSrc ? <img
      className={`pixel-diorama-art ${zoomed ? 'is-zoomed' : ''}`}
      data-artifact={surface}
      style={{ height: `${artHeightPercent}%` }}
      src={imageSrc}
      alt={`Isometric pixel-art interpretation of ${craft.name} on ${world === 'MARS' ? 'Martian' : 'lunar'} terrain`}
      onError={onImageError}
      draggable={false}
    /> : <div className="pixel-diorama-unsupported">PIXEL MODEL NOT AVAILABLE</div>}
    <div className="pixel-diorama-controls">
      <span>2.5D PIXEL SCENE • ~{equipmentMeters.toFixed(2)} m / 1.75 m HUMAN</span>
      <button type="button" aria-pressed={zoomed} onClick={() => setZoomed(value => !value)}>{zoomed ? '− ZOOM OUT' : '+ ZOOM'}</button>
    </div>
  </div>;
}
