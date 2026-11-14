import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SURFACE_HEIGHTS_METERS, ASTRONAUT_HEIGHT_METERS } from '../src/data/surfaceScale.js';
import { moon } from '../src/data/moon.js';
import { mars } from '../src/data/mars.js';
import { ASTRONAUT_ATLAS_FRAME_HEIGHT, ASTRONAUT_ATLAS_FRAME_WIDTH } from '../src/data/astronautSprite.js';
const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
assert.equal(moon.records.length, 4);
assert.equal(mars.records.length, 5);
assert.equal(ASTRONAUT_HEIGHT_METERS, 1.75);
assert.equal(ASTRONAUT_ATLAS_FRAME_HEIGHT, 210);
assert.equal(ASTRONAUT_ATLAS_FRAME_WIDTH, 144);
for (const [world, records] of [['moon', moon.records], ['mars', mars.records]]) {
  for (const record of records) {
    const id = record[0];
    assert.ok(SURFACE_HEIGHTS_METERS[id] > 0, `${world}/${id}: missing height`);
    const sprite=id==='eagle'?'eagle-reconstruction-pixel.png': id==='spirit'||id==='opportunity'?'twins-pixel.png':`${id}-pixel.png`;
    assert.ok(fs.existsSync(path.join(base, `public/assets/surface/${sprite}`)), `${world}/${id}: missing artwork`);
  }
}
const atlas = fs.readFileSync(path.join(base, 'public/assets/astronaut-myanmar-4frames.png'));
assert.equal(atlas.subarray(1, 4).toString('hex'), '504e47');
assert.equal(atlas.readUInt32BE(16), 4 * ASTRONAUT_ATLAS_FRAME_WIDTH);
assert.equal(atlas.readUInt32BE(20), ASTRONAUT_ATLAS_FRAME_HEIGHT);
const martian = fs.readFileSync(path.join(base, 'src/game/marsEngine.js'), 'utf8');
const lunar = fs.readFileSync(path.join(base, 'src/game/lunarSurface.js'), 'utf8');
assert.ok(martian.includes('ASTRONAUT_ATLAS_URL') && martian.includes('SURFACE_HEIGHTS_METERS'));
assert.ok(lunar.includes('ASTRONAUT_ATLAS_URL') && lunar.includes('SURFACE_HEIGHTS_METERS'));
assert.ok(!lunar.includes('function changeSite('), 'Moon must show equipment in one scene');
assert.ok(!martian.includes('function changeSite('), 'Mars must show equipment in one scene');
assert.match(fs.readFileSync(path.join(base, 'src/components/SurfaceShell.jsx'), 'utf8'), /spaceship-landing-12\.webp/, 'Landing scene uses classic ship artwork');
assert.ok(fs.readFileSync(path.join(base, 'src/components/OuterSpace.jsx'), 'utf8').includes('outer-ship-angle'), 'Orbital ship uses original pixel-sprite sheet');
console.log('PASS: 9 historically distinct artifacts shown in two continuous gallery scenes; exact 4-frame astronaut, pixel size scale.');
