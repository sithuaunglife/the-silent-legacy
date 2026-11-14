/** Each surface gets an independent NASA equipment dialog and optional lunar scan. */
export function createArtifactViewer(artifact, getLunar = () => null) {
  const events = new AbortController();
  const scan = artifact.querySelector('.outer-artifact-scan');
  const progress = scan.querySelector('progress');
  const status = scan.querySelector('.outer-scan-status');
  const button = scan.querySelector('.outer-scan-button');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let activeScan;
  let frame = 0;

  function show([id, name, credit, caption, source], lunarIndex) {
    cancelAnimationFrame(frame);
    activeScan = lunarIndex;
    scan.hidden = lunarIndex === undefined;
    progress.hidden = true;
    const scanned = lunarIndex !== undefined && getLunar()?.isScanned(lunarIndex);
    status.textContent = scanned ? 'Scan complete' : '';
    button.textContent = scanned ? 'Scan again' : 'Run scan';
    button.disabled = false;
    artifact.querySelector('h2').textContent = name;
    const photo = artifact.querySelector('img');
    photo.src = `/assets/surface/${id}-nasa.webp`;
    photo.alt = name;
    artifact.querySelector('figcaption').textContent = credit;
    artifact.querySelector('.outer-artifact-copy').textContent = caption;
    artifact.querySelector('a').href = source;
    if (!artifact.open) artifact.showModal();
  }
  button.addEventListener('click', () => {
    if (activeScan === undefined) return;
    const index = activeScan;
    button.disabled = true;
    progress.hidden = false;
    status.textContent = 'Scanning artifact…';
    const started = performance.now();
    function advance(now) {
      if (!artifact.open || activeScan !== index) return;
      progress.value = reducedMotion.matches ? 1 : Math.min((now - started) / 1300, 1);
      if (progress.value < 1) { frame = requestAnimationFrame(advance); return; }
      getLunar()?.markScanned(index);
      status.textContent = 'Scan complete';
      button.textContent = 'Scan again';
      button.disabled = false;
    }
    progress.value = 0;
    frame = requestAnimationFrame(advance);
  }, {signal:events.signal});
  artifact.addEventListener('close', () => cancelAnimationFrame(frame), {signal:events.signal});
  return {show, destroy(){cancelAnimationFrame(frame);events.abort();if(artifact.open)artifact.close();}};
}
