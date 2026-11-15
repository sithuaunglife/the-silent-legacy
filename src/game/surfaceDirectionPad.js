/**
 * Shared touch/mouse directional pad for Moon and Mars.
 * Physical WASD/arrow controls remain handled by the individual world engines.
 * Each pointer is tracked independently so two fingers can move diagonally.
 */
export function bindSurfaceDirectionPad(surface, pressedKeys, { canMove, onMove } = {}) {
  const pad = surface.querySelector('.outer-direction-pad');
  if (!pad) throw new Error('Missing shared surface direction pad');
  const controller = new AbortController();
  const heldByPointer = new Map();
  const buttons = [...pad.querySelectorAll('button[data-move]')];
  const sync = () => {
    pressedKeys.clear();
    for (const key of heldByPointer.values()) pressedKeys.add(key);
    for (const button of buttons) {
      const active = pressedKeys.has(button.dataset.move);
      button.classList.toggle('is-pressed', active);
      button.setAttribute('aria-pressed', String(active));
    }
  };
  const release = (event) => {
    if (!heldByPointer.has(event.pointerId)) return;
    heldByPointer.delete(event.pointerId);
    sync();
  };
  for (const button of buttons) {
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !canMove?.()) return;
      event.preventDefault();
      onMove?.();
      heldByPointer.set(event.pointerId, button.dataset.move);
      button.setPointerCapture?.(event.pointerId);
      sync();
    }, {signal:controller.signal});
    button.addEventListener('pointerup', release, {signal:controller.signal});
    button.addEventListener('pointercancel', release, {signal:controller.signal});
    button.addEventListener('lostpointercapture', release, {signal:controller.signal});
    // Prevent native click actions that might move focus during play.
    button.addEventListener('click', event => event.preventDefault(), {signal:controller.signal});
  }
  const reset = () => { heldByPointer.clear(); sync(); };
  window.addEventListener('blur', reset, {signal:controller.signal});
  return { reset, destroy() { reset(); controller.abort(); } };
}
