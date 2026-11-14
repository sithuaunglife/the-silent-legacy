# The Silent Legacy — NASA Interactive Archive

React + Vite frontend for the NASA Moon and Mars equipment storytelling experience.

## Interactive flow

1. Enter the Outer Space scene, fly or use **Go to Moon / Go to Mars**.
2. The ship approaches and lands on the destination surface.
3. Select an isometric **2.5D pixel** equipment sprite (or the lunar equipment preview card).
4. A React-powered mission telemetry dashboard opens showing mission-specific stats, summaries, real-source links, photos, rotating procedural 360° model, mission chapters, and EN/MY language toggle.
5. Close the dashboard to continue exploring, or use **Return to orbit**.

Equipment names and summaries from the user-supplied `dash board.html` have been retained for its seven original units. Apollo 12 ALSEP, Phoenix and Ingenuity have been added to cover the four in-world Moon items and four Mars markers. The Mars `Spirit & Opportunity` marker opens Spirit first, with Opportunity selectable in the Mars roster.

The 360° models are **stylized low-poly reconstructions**, not NASA engineering scans. Local transparent WebP images are isometric pixel-art representations, separate from documentary NASA photographs. Some archive photographs are externally hosted and may fall back to locally bundled reference art if offline. The records link to NASA's mission pages where possible; photo identification/credits and historical values should be independently reviewed before presenting this as authoritative NASA data.

## Development

```bash
npm install
npm run test:jsx
npm run test:archive
npm run dev
```

`npm run build` creates the production build. Windows Smart App Control may block native Rollup binaries; this project retains the `@rollup/wasm-node` override from the prior Windows-compatible version. Never disable Windows security to run the app.

## Code architecture

- `src/components/OuterSpace.jsx` — outer-space scene
- `src/components/Moon.jsx` — lunar exploration scene
- `src/components/Mars.jsx` — Mars exploration scene
- `src/components/archive/ArchiveDashboard.jsx` — user-provided telemetry dashboard converted to interactive React
- `src/components/archive/ArtifactModel.jsx` — 360° Three.js viewer with lifecycle cleanup
- `src/components/archive/archiveModels.js` — individual procedural spacecraft representations
- `src/data/archiveCatalog.js` — original seven dashboard records, plus equipment-specific additions
- `src/data/archiveDashboard.json` — source data preserved from `dash board.html` (no runtime network dependency)
- `src/game/artifactViewer.js` — event bridge from canvas worlds into React archive
- `src/game/outerSpaceEngine.js` — spaceship controls and stable sprite rendering
- `public/assets/` — original image textures, isometric spacecraft sprites, NASA-style references; retain license and credits files.

## Testing status

- JavaScript syntax checks and React import/static source tests: passed.
- Standalone AppDeploy preview: deployed successfully; automated first-load QA reported no frontend errors.
- Complete Windows native Vite build and long-duration manual gameplay walkthrough: not independently validated here.
- NASA does not endorse this project.
