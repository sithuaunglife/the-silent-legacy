/** Pixelated Martian landscape. Unmodified terrain algorithm from the original NASA preview. */
export function paintMarsTerrain(canvas, world) {
  canvas.width = 440;
  canvas.height = 260;
  function paintTerrain(world) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    const horizon = 137;
    ctx.fillStyle = world.sky;
    ctx.fillRect(0, 0, width, height);
    let seed = 1943;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let y = 10; y < horizon; y += 2) {
      ctx.fillStyle = `rgba(218,108,67,${((y / horizon) ** 2 * .54).toFixed(3)})`;
      ctx.fillRect(0, y, width, 2);
    }
    for (let i = 0; i < 43; i++) {
      ctx.fillStyle = i % 5 ? '#6c5d78' : '#c899a0';
      ctx.fillRect(Math.round(random() * width), Math.round(random() * 72), i % 7 ? 1 : 2, 1);
    }
    for (const [depth, color] of world.ridges.entries()) {
      ctx.fillStyle = color;
      for (let x = 0; x < width; x += 3) {
        const y = Math.round(horizon - 23 + depth * 8 - 5 * Math.sin(x * .029 + depth) - 8 * Math.sin(x * .015 + 1.8 * depth) - random() * 3);
        ctx.fillRect(x, y, 3, height - y);
      }
    }
    for (let y = horizon; y < height; y++) {
      const depth = (y - horizon) / (height - horizon);
      for (let x = 0; x < width; x += 4) {
        const relief = Math.sin(x * .031 + y * .074) * .47 + Math.sin(x * .07 - y * .14) * .34;
        const shade = Math.min(4, Math.max(0, Math.floor(depth * 4 + relief + .6)));
        ctx.fillStyle = world.ground[shade];
        ctx.fillRect(x, y, 4, 1);
      }
    }
    for (let i = 0; i < 660; i++) {
      const spread = random();
      const y = Math.round(horizon + spread * (height - horizon));
      ctx.fillStyle = world.stone[i % world.stone.length];
      ctx.fillRect(Math.round(random() * width), y, 1 + Math.round(random() * spread * 8), 1 + Math.floor(spread * 2));
    }
    for (const [cx, cy, rx, ry] of [[84,174,23,5],[353,220,36,9],[52,245,38,8],[390,158,19,4]]) {
      for (let row = -ry; row <= ry; row++) {
        const span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (row / ry) ** 2)));
        ctx.fillStyle = row < 1 ? world.stone[0] : world.stone[1];
        ctx.fillRect(cx - span, cy + row, span * 2, 1);
      }
    }
  }

  paintTerrain(world);
}
