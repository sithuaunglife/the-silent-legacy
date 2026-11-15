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
assert.ok(app.includes('orbitTransitionVisible'));
assert.ok(launcher.includes("let autoStage = false"));
assert.ok(launcher.includes("MISSION.shipAngle = -Math.PI / 2"));
assert.ok(launcher.includes("MISSION.altitudeKm >= 62"));
assert.ok(!launcher.includes('drawDetachedParts();'));
assert.ok(fs.readFileSync('public/launch/index.html','utf8').includes('id="btnLaunch" disabled'));
console.log('PASS: 2.5D spaceplane, vertical launch, no jettison, Earth-orbit transition');
