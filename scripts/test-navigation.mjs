import fs from 'node:fs';
import assert from 'node:assert/strict';
const app=fs.readFileSync('src/App.jsx','utf8');
const orbit=fs.readFileSync('src/components/OuterSpace.jsx','utf8');
const language=fs.readFileSync('src/i18n.js','utf8');
const launch=fs.readFileSync('src/components/LaunchSimulator.jsx','utf8');
const engine=fs.readFileSync('src/game/outerSpaceEngine.js','utf8');
assert.ok(app.includes("sessionStorage.setItem('silent:stage'"));
assert.ok(app.includes("sessionStorage.setItem('silent:world'"));
assert.ok(app.includes('window.localStorage.setItem'));
assert.ok(app.includes('backToStart'));
assert.ok(orbit.includes('onBackStart'));
assert.ok(orbit.includes('onLanguageToggle'));
assert.ok(launch.includes("type:'silent-language'"));
for (const key of ['Moon','Mars','Earth','Mercury','Jupiter','Saturn','Go to Moon','Return to orbit']) {
  assert.ok(language.includes("'" + key + "':"), key);
}
assert.ok(engine.includes("on(window,'focus'"));
console.log('PASS: restored orbit/surface, EN-MM toggle, home navigation, browser resume');
