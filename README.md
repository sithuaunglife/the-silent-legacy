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
