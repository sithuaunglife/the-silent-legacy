# The Silent Legacy — NASA Space Exploration

NASA storytelling exploration game featuring interactive outer-space flight, 2.5D Moon and Mars landing environments, and historical space artifacts.

## Stack

React 18 + Vite 6, JavaScript, CSS, canvas graphics. No backend required.

## Local development

```bash
npm install
npm run test:jsx
npm run dev
```

Visit the Vite URL (normally `http://localhost:5173`). To verify a production bundle, run `npm run build`.

Windows Smart App Control can block native Rollup binaries; this project uses the WASM Rollup override in `package.json`.

## Structure

- `src/components/OuterSpace.jsx` — main flight UI
- `src/game/outerSpaceEngine.js` — outer-space animation and input lifecycle
- `src/components/Moon.jsx` and `src/game/moonEngine.js` — lunar surface
- `src/components/Mars.jsx` and `src/game/marsEngine.js` — Martian surface
- `src/data/` — NASA artifact records for Moon and Mars
- `src/styles/` — separated environment styles
- `public/assets/` — image textures, NASA artifacts, and legacy globe rendering bundle

The Earth globe asset (`public/assets/earth-globe.js`) is loaded by the outer-space component and **must be retained**. The source includes image and shader licenses in `public/assets`.

## Verification

The JSX import checker can be run with `npm run test:jsx`. Run `npm run build` before deploying. The game is client-side and does not require a Java Spring backend.

## Data / attribution

NASA mission descriptions are informative; links and image-credit records are in the `src/data` and `public/assets` folders. NASA does not endorse this project.
