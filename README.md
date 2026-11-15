# The Silent Legacy — Classic OuterSpace (No Start/Launch)

React + Vite pixel-art NASA equipment exploration. This is the version **before** the Start Page and Earth Launch intro were added. It opens directly in OuterSpace. The classic pixel spacecraft and existing Moon/Mars surfaces and NASA inspection dashboard are preserved.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`. Use `/?surface=moon` or `/?surface=mars` for direct previews.

Windows Smart App Control: the project retains the Rollup WASM override.

## Navigation

- Space: pixel-art orbital map with classic ship and Moon / Mars buttons. Click the ship to inspect Voyager (no automatic archive).
- Moon/Mars: common 2.5D artifact galleries, surface walk and jump, close-range INSPECT [E], NASA equipment details.
- Return to orbit: existing return control and departure animation.

This package excludes the experimental StartPage, LaunchSequence and related intro engine/styles. It is a local revert; **no GitHub push** is included.

## Eagle sprite reference

Eagle uses the uploaded pixel-art lunar module reference as a single transparent sprite, in both the Moon surface and the inspection viewer. There is no second custom-drawn upper cabin/head. The original upload is preserved at `public/assets/reference/eagle-user-original.jpg`, the transparent game sprite at `public/assets/surface/eagle-user-reference.png`. The complete-module drawing is an educational visual; in reality only the descent stage remained on the Moon.


### Full-screen expedition update (preview)
- Moon/Mars surface dialogs fill the entire browser viewport, including small screens.
- Contextual landing dialogue explains approach, descent and crew egress. The astronaut visibly walks out after touchdown, then a mission briefing asks to scan all equipment.
- Smaller artifact inspection cards and minimal outline-free WASD controls at the right edge.
- Additional pixel microcraters, basalt, wheel ruts and strata drawn in the existing terrain canvases.
- No start page or Earth launch sequence; GitHub is not modified by preview deployments.
