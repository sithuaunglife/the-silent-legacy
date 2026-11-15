/**
 * Animated pixel starfield and original responsive scene framing.
 * This module is mounted only while the React start screen is visible.
 */
export function mountStartScreenStars(canvas, scene, app) {
  const ctx = canvas?.getContext('2d', { alpha: true });
  if (!canvas || !scene || !app || !ctx) return () => {};

  let width = 0;
  let height = 0;
  let raf = 0;
  let tick = 0;
  let stars = [];
  let stopped = false;

  function fit() {
    const w = app.clientWidth;
    const h = app.clientHeight;
    let scale = Math.min(w / 1440, h / 820);

    if (w < 650) {
      scale = Math.min(w / 910, h / 520);
      scene.style.left = '50%';
      scene.style.top = '43%';
    } else {
      scene.style.left = '50%';
      scene.style.top = '50%';
    }

    scene.style.setProperty('--fit', String(scale));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.floor(w);
    height = Math.floor(h);
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let seed = 168940;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const palette = ['#ffffff', '#cbeeff', '#ffcfbc', '#f2e4d1', '#9fcaf1', '#c3a4ee'];
    stars = Array.from(
      { length: Math.min(1400, Math.round(width * height / 760)) },
      () => ({
        x: random() * width,
        y: random() * height,
        sz: random() > .94 ? 2 : 1,
        a: .15 + random() * .72,
        phase: random() * Math.PI * 2,
        c: palette[Math.floor(random() * palette.length)],
      }),
    );
  }

  function draw() {
    if (stopped) return;
    ctx.clearRect(0, 0, width, height);
    tick++;
    for (const star of stars) {
      ctx.globalAlpha = Math.max(.12, Math.min(1, star.a + Math.sin(tick * .012 + star.phase) * .12));
      ctx.fillStyle = star.c;
      ctx.fillRect(Math.round(star.x), Math.round(star.y), star.sz, star.sz);
    }
    ctx.globalAlpha = 1;
    raf = window.requestAnimationFrame(draw);
  }

  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
  fit();
  observer?.observe(app);
  window.addEventListener('resize', fit, { passive: true });
  raf = window.requestAnimationFrame(draw);

  return () => {
    stopped = true;
    window.cancelAnimationFrame(raf);
    window.removeEventListener('resize', fit);
    observer?.disconnect();
  };
}
