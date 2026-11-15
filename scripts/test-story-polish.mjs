import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=(p)=>fs.readFileSync(p,'utf8');
const app=read('src/App.jsx'),audio=read('src/game/storyAudio.js'),
      ending=read('public/ending/index.html'),launch=read('public/launch/script.js'),
      orbit=read('src/game/outerSpaceEngine.js'),mars=read('src/game/marsEngine.js');
assert.match(launch,/const padX = 248;\s*const padY/);
assert.match(launch,/silent-launch-ready/);
assert.match(launch,/silent-audio/);
assert.match(app,/mission-sound-toggle/);
assert.ok(!app.includes('archive-sound-toggle'));
assert.match(app,/returnOriginRef/);
assert.match(app,/returnFallbackTimer/);
assert.match(app,/storySound\('scan'\)/);
assert.match(app,/storySound\('victory'\)/);
assert.match(audio,/setStoryAudioEnabled/);
for(const cue of ['mission','scan','touchdown','liftoff','orbit','victory']){
 assert.ok(audio.includes("case '"+cue+"'"),cue);
}
assert.match(ending,/orbitPlanetArt\.moon/);
assert.match(ending,/orbitPlanetArt\.earth/);
assert.match(ending,/drawSpacecraftSprite\(shipX, shipY, 0, true, true\)/);
assert.match(ending,/ctx\.scale\(-1,1\)/);
assert.match(ending,/langMy/);
assert.match(ending,/silent-ending-sfx/);
assert.match(ending,/sound:'touchdown'/);
assert.match(orbit,/The player's ship is a navigation sprite/);
assert.match(mars,/outer-mars-jump/);
assert.match(read('src/styles/outerspace.css'),/\.outer-scene > \.outer-pad/);
assert.ok(!ending.includes('PILOT RANK'));
console.log('PASS: Moon return recovery, rank removed, audio separation, spaceship, localized ending and Mars jump');
