import fs from 'node:fs';
import assert from 'node:assert/strict';
const app=fs.readFileSync('src/App.jsx','utf8');
const launcher=fs.readFileSync('public/launch/script.js','utf8');
for(const name of ['upright','cruise']){
  assert.ok(fs.existsSync('public/launch/assets/spacecraft-' + name + '.png'));
  assert.ok(launcher.includes('assets/spacecraft-' + name + '.png'));
}
assert.ok(launcher.includes('drawImage(ship'));
assert.ok(launcher.includes('orbitHandoffTimer'));
assert.ok(app.includes('earth-orbit-transition'));
assert.ok(app.includes('orbitalEntry'));
console.log('PASS: pixel-spaceplane, stages, orbit transition');
