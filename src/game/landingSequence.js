/** Timed entry, touchdown and takeoff sequence reused without sharing world state. */
export function createLandingSequence({surface, world, beforeLand, onLanded, beforeLeave, board, onClosed}) {
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
  const schedule = (fn, ms) => {timeout = setTimeout(() => {if(!disposed && surface.open) fn();},ms);};
  function clear() {clearTimeout(timeout);}

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
    returnButton.disabled = true;
    surface.showModal();
    title.focus({preventScroll:true});
    const arrived = () => {
      surface.dataset.phase = 'landed';
      status.textContent = world.arrival;
      returnButton.disabled = false;
      onLanded();
    };
    if(reducedMotion.matches) {arrived();return;}
    schedule(() => {
      surface.dataset.phase = 'descent';
      status.textContent = `Descending to ${world.name}`;
      schedule(() => {
        surface.dataset.phase = 'slide';
        status.textContent = 'Sliding to a stop';
        schedule(arrived,slideDuration);
      },descentDuration);
    },world.entryDuration);
  }

  function leave() {
    if (surface.dataset.phase !== 'landed' || disposed) return;
    returnButton.disabled = true;
    beforeLeave?.();
    const liftOff = () => {
      if (reducedMotion.matches) {closeAndLaunch();return;}
      surface.dataset.phase='launch';
      status.textContent='Lifting off';
      schedule(closeAndLaunch,launchDuration);
    };
    if (board) {
      surface.dataset.phase='boarding';
      status.textContent='Returning to the spaceship';
      board(liftOff);
    } else liftOff();
  }
  function closeAndLaunch() {
    if (!surface.open) return;
    surface.dispatchEvent(new CustomEvent('orbit:launch',{bubbles:true,detail:world.id}));
    surface.close();
    surface.dispatchEvent(new CustomEvent('space:closed',{bubbles:true}));
    onClosed?.();
  }
  function onClose() {clear();}
  function onCancel(event) {event.preventDefault();}
  returnButton.addEventListener('click', leave, {signal:events.signal});
  surface.addEventListener('close', onClose, {signal:events.signal});
  surface.addEventListener('cancel', onCancel, {signal:events.signal});
  return {land, leave, destroy(){disposed=true;clear();events.abort();if(surface.open)surface.close();}};
}
