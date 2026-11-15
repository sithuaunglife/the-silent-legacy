/**
 * Hold a D-pad arrow to walk; tap for one short step. Buttons also work
 * via native keyboard activation without intercepting the document.
 */
export function bindSurfaceMovement(surface, pressed, playable, nudge, signal) {
  const buttons = surface.querySelectorAll('.outer-movement-pad button[data-move]');
  for (const button of buttons) {
    const key = button.dataset.move;
    const release = () => {
      pressed.delete(key);
      button.classList.remove('is-pressed');
    };
    button.addEventListener('pointerdown', event => {
      if (!playable()) return;
      event.preventDefault();
      nudge(key);
      pressed.add(key);
      button.classList.add('is-pressed');
      try { button.setPointerCapture(event.pointerId); } catch {}
    }, {signal});
    for (const name of ['pointerup','pointercancel','lostpointercapture','pointerleave']) {
      button.addEventListener(name, release, {signal});
    }
    button.addEventListener('click', event => {
      // Native Enter/Space activation fires a keyboard click with detail=0.
      if (playable() && event.detail === 0) nudge(key);
    }, {signal});
    button.addEventListener('blur', release, {signal});
  }
}
