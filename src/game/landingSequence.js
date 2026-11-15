/** Shared landing lifecycle and unobtrusive mission-control dialogue. */
export function createLandingSequence({surface, world, beforeLand, onLanded, beforeLeave, board, onClosed}) {
  const title = surface.querySelector('h2');
  const status = surface.querySelector('.outer-surface-status');
  const returnButton = surface.querySelector('.outer-return');
  const communication = surface.querySelector('.outer-mission-dialogue');
  const communicationTitle = communication.querySelector('.outer-mission-dialogue-title');
  const communicationBody = communication.querySelector('.outer-mission-dialogue-body');
  const dismiss = communication.querySelector('.outer-mission-dialogue-dismiss');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  const descentDuration = 1500;
  const slideDuration = 920;
  const launchDuration = 1550;
  let timeout = null;
  let noticeTimeout = null;
  let disposed = false;
  let epoch = 0;
  const schedule = (fn, ms) => {
    const sequence = epoch;
    timeout = setTimeout(() => {if(!disposed && surface.open && epoch === sequence) fn();}, ms);
  };
  function clear() {
    clearTimeout(timeout);
    clearTimeout(noticeTimeout);
    timeout = noticeTimeout = null;
  }
  function hideNotice() {
    clearTimeout(noticeTimeout);
    communication.hidden = true;
  }
  function announce(heading, message, holdMs = 0) {
    if(disposed || !surface.open) return;
    clearTimeout(noticeTimeout);
    communicationTitle.textContent = heading;
    communicationBody.textContent = message;
    communication.hidden = false;
    if(holdMs > 0) noticeTimeout = setTimeout(() => {if(!disposed) hideNotice();}, holdMs);
  }
  const bodyName = world.id === 'moon' ? 'lunar' : 'Martian';
  const count = world.records.length;
  dismiss.addEventListener('click', hideNotice, {signal:events.signal});

  function land() {
    if(disposed || surface.open) return;
    epoch++;
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
    announce('APPROACH VECTOR LOCKED', `Spaceship entering ${world.name} approach. Astronaut secured inside the capsule.`);
    const crewReady = () => {
      if(disposed || !surface.open || surface.dataset.phase !== 'egress') return;
      surface.dataset.phase = 'landed';
      status.textContent = world.arrival;
      returnButton.disabled = false;
      announce('EXPLORATION MISSION', `Astronaut deployed. Explore the ${bodyName} surface and scan all ${count} machines. Move with W A S D; approach an artifact, then press E to inspect.`, 9500);
    };
    const arrived = () => {
      if(disposed || !surface.open) return;
      surface.dataset.phase = 'egress';
      status.textContent = 'Touchdown confirmed · Crew hatch opening';
      announce('TOUCHDOWN CONFIRMED', 'The landing ship is down. Astronaut exiting the capsule now.');
      // Engines call crewReady only once the astronaut has visibly left the ship.
      onLanded({crewReady});
    };
    if(reducedMotion.matches) {arrived();return;}
    schedule(() => {
      surface.dataset.phase = 'descent';
      status.textContent = `Descending to ${world.name}`;
      announce('DESCENT IN PROGRESS', 'Engines stabilizing. The astronaut remains inside until touchdown.');
      schedule(() => {
        surface.dataset.phase = 'slide';
        status.textContent = 'Sliding to a stop';
        announce('FINAL APPROACH', 'Ground contact confirmed. Preparing the cabin for crew exit.');
        schedule(arrived, slideDuration);
      }, descentDuration);
    }, world.entryDuration);
  }

  function leave() {
    if(surface.dataset.phase !== 'landed' || disposed) return;
    returnButton.disabled = true;
    hideNotice();
    beforeLeave?.();
    const liftOff = () => {
      if(reducedMotion.matches) {closeAndLaunch();return;}
      surface.dataset.phase='launch';
      status.textContent='Lifting off';
      announce('RETURN TO ORBIT', 'Crew safely aboard. Engines firing for departure.');
      schedule(closeAndLaunch,launchDuration);
    };
    if(board) {
      surface.dataset.phase='boarding';
      status.textContent='Returning to the spaceship';
      announce('CREW RECALL', 'Astronaut returning to the lander. Departure systems online.');
      board(liftOff);
    } else liftOff();
  }
  function closeAndLaunch() {
    if(!surface.open) return;
    hideNotice();
    surface.dispatchEvent(new CustomEvent('orbit:launch',{bubbles:true,detail:world.id}));
    surface.close();
    surface.dispatchEvent(new CustomEvent('space:closed',{bubbles:true}));
    onClosed?.();
  }
  function onClose() { epoch++;clear();hideNotice(); }
  function onCancel(event) {event.preventDefault();}
  returnButton.addEventListener('click', leave, {signal:events.signal});
  surface.addEventListener('close', onClose, {signal:events.signal});
  surface.addEventListener('cancel', onCancel, {signal:events.signal});
  return {land,leave,destroy(){disposed=true;epoch++;clear();hideNotice();events.abort();if(surface.open)surface.close();}};
}
