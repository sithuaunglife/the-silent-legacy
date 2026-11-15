/** Radio-copy helper shared by landing, egress and equipment scans. */
export function setMissionDialogue(surface, message, mode = 'info') {
  const box = surface.querySelector('.outer-mission-comms');
  const line = box?.querySelector('.outer-mission-message');
  if (!line) return;
  line.textContent = message;
  box.dataset.mode = mode;
}

/** Entry -> ship touchdown -> astronaut exits -> exploration -> return to orbit. */
export function createLandingSequence({surface, world, beforeLand, onDeploy, onLanded, beforeLeave, board, onClosed}) {
  const title = surface.querySelector('h2');
  const status = surface.querySelector('.outer-surface-status');
  const returnButton = surface.querySelector('.outer-return');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  const descentDuration = 1500;
  const slideDuration = 920;
  const launchDuration = 1550;
  let timeout;
  let disposed = false;
  const schedule = (fn, ms) => {timeout = setTimeout(() => {if (!disposed && surface.open) fn();}, ms);};
  function clear() { clearTimeout(timeout); }

  function arrived() {
    if (disposed || !surface.open || surface.dataset.phase !== 'deploy') return;
    surface.dataset.phase = 'landed';
    status.textContent = world.arrival;
    returnButton.disabled = false;
    onLanded?.();
    setMissionDialogue(surface,
      'Astronaut on the surface. Your mission: approach and scan every abandoned machine. Walk with WASD or the right-hand controls; inspect with E.',
      'ready');
  }
  function beginEgress() {
    if (disposed || !surface.open) return;
    surface.dataset.phase = 'deploy';
    status.textContent = 'Touchdown confirmed · astronaut exiting lander';
    setMissionDialogue(surface, 'Touchdown confirmed. The landing craft is secure. Opening the hatch and deploying the astronaut…', 'transit');
    if (onDeploy) onDeploy(arrived);
    else schedule(arrived, reducedMotion.matches ? 0 : 1200);
  }
  function land() {
    if (disposed || surface.open) return;
    clear();
    beforeLand();
    surface.dataset.phase = 'entry';
    surface.style.setProperty('--entry-duration', `${world.entryDuration}ms`);
    surface.style.setProperty('--descent-duration', `${descentDuration}ms`);
    surface.style.setProperty('--slide-duration', `${slideDuration}ms`);
    surface.style.setProperty('--launch-duration', `${launchDuration}ms`);
    title.textContent = world.name;
    status.textContent = world.entry;
    setMissionDialogue(surface, `Entering ${world.name} approach. Stand by for atmospheric / orbital descent.`, 'transit');
    returnButton.disabled = true;
    surface.showModal();
    title.focus({preventScroll:true});
    if (reducedMotion.matches) { beginEgress(); return; }
    schedule(() => {
      surface.dataset.phase = 'descent';
      status.textContent = `Descending to ${world.name}`;
      setMissionDialogue(surface, 'Landing trajectory locked. Thrusters active; crew secured inside the craft.', 'transit');
      schedule(() => {
        surface.dataset.phase = 'slide';
        status.textContent = 'Landing burn complete · settling on surface';
        setMissionDialogue(surface, 'Final approach complete. Awaiting stable touchdown before astronaut egress.', 'transit');
        schedule(beginEgress, slideDuration);
      }, descentDuration);
    }, world.entryDuration);
  }

  function leave() {
    if (surface.dataset.phase !== 'landed' || disposed) return;
    returnButton.disabled = true;
    beforeLeave?.();
    const liftOff = () => {
      if (reducedMotion.matches) { closeAndLaunch(); return; }
      surface.dataset.phase = 'launch';
      status.textContent = 'Lifting off';
      setMissionDialogue(surface, 'Crew secured. Beginning ascent to orbit.', 'transit');
      schedule(closeAndLaunch, launchDuration);
    };
    if (board) {
      surface.dataset.phase = 'boarding';
      status.textContent = 'Returning astronaut to the lander';
      setMissionDialogue(surface, 'Mission control: return to the spacecraft for orbital departure.', 'transit');
      board(liftOff);
    } else liftOff();
  }
  function closeAndLaunch() {
    if (!surface.open) return;
    surface.dispatchEvent(new CustomEvent('orbit:launch', {bubbles:true, detail:world.id}));
    surface.close();
    surface.dispatchEvent(new CustomEvent('space:closed', {bubbles:true}));
    onClosed?.();
  }
  function onClose() { clear(); }
  function onCancel(event) { event.preventDefault(); }
  returnButton.addEventListener('click', leave, {signal:events.signal});
  surface.addEventListener('close', onClose, {signal:events.signal});
  surface.addEventListener('cancel', onCancel, {signal:events.signal});
  return {land, leave, destroy(){disposed=true;clear();events.abort();if(surface.open)surface.close();}};
}
