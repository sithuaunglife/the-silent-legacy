import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const start = fs.readFileSync('src/components/StartScreen.tsx', 'utf8');
const css = fs.readFileSync('src/styles/startScreen.css', 'utf8');
const stars = fs.readFileSync('src/game/startScreenStars.js', 'utf8');

assert.ok(app.includes("import StartScreen from './components/StartScreen'"));
assert.ok(app.includes('!launchComplete && !startDismissed'));
assert.ok(app.includes('setStartDismissed(false)'));
assert.ok(start.includes('onClick={onBegin}'));
assert.ok(start.includes('BEGIN THE JOURNEY'));
assert.ok(start.includes("data-i18n-ignore='true'"), 'Keep Start Screen text in English even when Myanmar UI is selected');
assert.ok(start.includes("lang='en'"), 'Brand/title screen language is English');
const i18n = fs.readFileSync('src/i18n.js', 'utf8');
assert.ok(i18n.includes("node.parentElement?.closest('[data-i18n-ignore]')"), 'Global localization must skip all Start Screen text nodes');
assert.ok(start.includes('mountStartScreenStars'));
assert.ok(!start.includes('ship-area'), 'Old visible spaceship must remain removed');
assert.ok(css.includes('nasa-planet-axial-spin'), 'Slow 2.5D planet rotation must remain');
assert.ok(css.includes('rgba(21, 66, 91, .20)'), 'Transparent compact CTA must remain');
assert.ok(stars.includes('window.cancelAnimationFrame(raf)'));
for (const asset of ['earth', 'moon', 'mars', 'voyager']) {
  assert.ok(fs.existsSync('public/assets/start/' + asset + '.png'));
}
console.log('PASS: approved 2.5D Start UI, responsive starfield, planet rotation and launch handoff');
