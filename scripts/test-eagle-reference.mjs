import fs from 'node:fs';
import assert from 'node:assert/strict';
import { eagleReferenceArt } from '../src/data/eagleArt.js';
import { surfaceSpriteUrl } from '../src/data/surfaceScale.js';

const source = fs.readFileSync('public/assets/surface/eagle-user-reference.png');
assert.equal(source.subarray(1, 4).toString(), 'PNG');
assert.equal(source.readUInt32BE(16), 352);
assert.equal(source.readUInt32BE(20), 360);
assert.equal(source[25], 6, 'Eagle sprite should use RGBA (transparent background)');
assert.equal(surfaceSpriteUrl('eagle'), eagleReferenceArt, 'Moon scene and dashboard must share supplied artwork');
assert.equal(Buffer.from(eagleReferenceArt.split(',')[1], 'base64').compare(source), 0, 'Inlined image and bundled PNG should match');
const viewer = fs.readFileSync('src/components/archive/PixelArtifactViewer.jsx', 'utf8');
assert.doesNotMatch(viewer, /pixel-diorama-reconstruction|Ascent cabin shown for context/, 'No custom reconstructed head notice');
assert.ok(!fs.existsSync('public/assets/surface/eagle-reconstruction-pixel.png'), 'Remove old custom artwork');
console.log('PASS: original Eagle reference is used once across Moon and inspect, transparent PNG, old custom head removed.');
