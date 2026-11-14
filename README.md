# The Silent Legacy — Moon / Mars Exploration Preview

React + Vite NASA pixel-art exploration preview.

## Latest changes (local preview only)

- Initial orbit view never auto-opens Voyager 1. Click the **moving spacecraft** (or orbit probe) to inspect Voyager 1.
- Astronaut sprite retains the original user-provided design; movement mirrors left/right.
- Moon: animated twinkling parallax stars, pixel-shaded Earth visible in sky, stepped 2.5D lunar craters with rims, recessed floors and regolith.
- Both surfaces: inspect actions are **proximity-only**; click machines to walk toward them, then click the small **INSPECT [E]** button beside the machine or press E.
- No GitHub updates were made.

## Run

```bash
npm install
npm run dev
```

Windows Smart App Control: this project retains its Rollup WASM override. For direct planet previews, append `?surface=moon` or `?surface=mars`.

## November 14 surface update

- **Use the uploaded astronaut drawing exactly:** `public/assets/reference/astronat-original.jpg` is the user-provided source. `public/assets/astronaut-myanmar-4frames.png` is only its four pose crops with exterior white removed. The Myanmar flag, visor, black outlines, clothing, pose and face are unchanged.
- All four Moon artifacts and all four Mars artifacts appear as *2.5D isometric pixel sprites*, resting on the same terrain plane with contact shadows, foreground gravel/dust, tint and occlusion.
- Approximate human-relative equipment heights are maintained centrally in `src/data/surfaceScale.js` (astronaut reference 1.75m). Some equipment figures are deliberately small, with larger clickable target zones for accessibility.
- Moon controls: WASD/arrows to