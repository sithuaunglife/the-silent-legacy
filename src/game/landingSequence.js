/** Bilingual Moon/Mars mission control. NASA names remain untouched. */
const MYANMAR_MISSION = {
 'APPROACH VECTOR LOCKED':'ချဉ်းကပ်လမ်းကြောင်း အတည်ပြုပြီး',
 'DESCENT IN PROGRESS':'ဆင်းသက်နေသည်',
 'FINAL APPROACH':'ဆင်းသက်ရန် နီးကပ်နေပြီ',
 'TOUCHDOWN CONFIRMED':'ဆင်းသက်မှု အတည်ပြုပြီး',
 'EXPLORATION MISSION':'လေ့လာရေးမစ်ရှင်',
 'RETURN TO ORBIT':'အာကာသပတ်လမ်းသို့ ပြန်နေသည်',
 'CREW RECALL':'အာကာသယာဉ်မှူးအား ပြန်ခေါ်နေသည်',
 'Engines stabilizing. The astronaut remains inside until touchdown.':'အင်ဂျင်များ တည်ငြိမ်အောင် ထိန်းညှိနေသည်။ ဆင်းသက်ပြီးသည်အထိ အာကာသယာဉ်မှူးသည် ယာဉ်အတွင်း ရှိနေမည်။',
 'Ground contact confirmed. Preparing the cabin for crew exit.':'မြေပြင်နှင့် ထိတွေ့မှု အတည်ပြုပြီး။ အာကာသယာဉ်မှူး ထွက်ရန် ပြင်ဆင်နေသည်။',
 'The landing ship is down. Astronaut exiting the capsule now.':'ဆင်းသက်ယာဉ် ဆင်းသက်ပြီးပါပြီ။ အာကာသယာဉ်မှူးသည် ယာဉ်အတွင်းမှ ထွက်လာနေပါသည်။',
 'Crew safely aboard. Engines firing for departure.':'အာကာသယာဉ်မှူး ယာဉ်ပေါ်ပြန်ရောက်ပြီ။ ထွက်ခွာရန် အင်ဂျင်များ စတင်နေသည်။',
 'Astronaut returning to the lander. Departure systems online.':'အာကာသယာဉ်မှူး ဆင်းသက်ယာဉ်သို့ ပြန်လာနေသည်။ ထွက်ခွာရန် စနစ်များ အသင့်ဖြစ်နေပြီ။',
 'Touchdown confirmed · Crew hatch opening':'ဆင်းသက်ပြီး · ယာဉ်တံခါး ဖွင့်နေသည်',
 'Sliding to a stop':'ဖြည်းဖြည်းချင်း ရပ်တန့်နေသည်',
 'Lifting off':'ပြန်လည်ပျံတက်နေသည်',
 'Returning to the spaceship':'အာကာသယာဉ်သို့ ပြန်နေသည်',
};
function renderMissionText(english){
 if(document.documentElement.lang!=='my')return english;
 if(MYANMAR_MISSION[english])return MYANMAR_MISSION[english];
 const entry=english.match(/^Spaceship entering (.+) approach\. Astronaut secured inside the capsule\.$/);
 if(entry)return entry[1]+' သို့ ချဉ်းကပ်ဆင်းသက်နေသည်။ အာကာသယာဉ်မှူး ယာဉ်အတွင်း လုံခြုံစွာ ရှိနေသည်။';
 const descent=english.match(/^Descending to (.+)$/);
 if(descent)return descent[1]+' သို့ ဆင်းသက်နေသည်';
 const scanned=english.match(/^Astronaut deployed\. Explore the (lunar|Martian) surface and scan all (\d+) machines\. Move with W A S D; approach an artifact, then press E to inspect\.$/);
 if(scanned)return 'အာကာသယာဉ်မှူး ဆင်းလာပါပြီ။ '+(scanned[1]==='Martian'?'အင်္ဂါဂြိုလ်':'လ')+' မျက်နှာပြင်ကို လေ့လာပြီး စက်ပစ္စည်း '+scanned[2]+' ခုလုံးကို စကန်ဖတ်ပါ။ W A S D ဖြင့် ရွှေ့ပါ။ စက်ပစ္စည်းနားသို့ ချဉ်းကပ်ပြီး E ဖြင့် စစ်ဆေးပါ။';
 return english;
}

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
  let lastNotice=null;
  let lastStatus=null;
  function setStatus(text){lastStatus=text;status.textContent=renderMissionText(text);}
  function refreshLanguage(){
    if(disposed || !surface.open)return;
    if(lastNotice){
      communicationTitle.textContent=renderMissionText(lastNotice[0]);
      communicationBody.textContent=renderMissionText(lastNotice[1]);
    }
    if(lastStatus!==null)status.textContent=renderMissionText(lastStatus);
  }
  function announce(heading, message, holdMs = 0) {
    if(disposed || !surface.open) return;
    lastNotice=[heading,message];
    clearTimeout(noticeTimeout);
    communicationTitle.textContent=renderMissionText(heading);
    communicationBody.textContent=renderMissionText(message);
    communication.hidden = false;
    if (heading !== 'DESCENT IN PROGRESS' && heading !== 'FINAL APPROACH') {
      window.dispatchEvent(new CustomEvent('silent:story-sfx',{detail:{
        type: heading==='TOUCHDOWN CONFIRMED'?'touchdown':
              heading==='RETURN TO ORBIT'?'liftoff':'mission'
      }}));
    }
    if(holdMs > 0) noticeTimeout = setTimeout(() => {if(!disposed) hideNotice();}, holdMs);
  }
  const bodyName = world.id === 'moon' ? 'lunar' : 'Martian';
  const count = world.records.length;
  dismiss.addEventListener('click', hideNotice, {signal:events.signal});
  window.addEventListener('silent:language-change',refreshLanguage,{signal:events.signal});

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
    setStatus(world.entry);
    returnButton.disabled = true;
    surface.showModal();
    title.focus({preventScroll:true});
    announce('APPROACH VECTOR LOCKED', `Spaceship entering ${world.name} approach. Astronaut secured inside the capsule.`);
    const crewReady = () => {
      if(disposed || !surface.open || surface.dataset.phase !== 'egress') return;
      surface.dataset.phase = 'landed';
      setStatus(world.arrival);
      returnButton.disabled = false;
      announce('EXPLORATION MISSION', `Astronaut deployed. Explore the ${bodyName} surface and scan all ${count} machines. Move with W A S D; approach an artifact, then press E to inspect.`, 9500);
    };
    const arrived = () => {
      if(disposed || !surface.open) return;
      surface.dataset.phase = 'egress';
      setStatus('Touchdown confirmed · Crew hatch opening');
      announce('TOUCHDOWN CONFIRMED', 'The landing ship is down. Astronaut exiting the capsule now.');
      // Engines call crewReady only once the astronaut has visibly left the ship.
      onLanded({crewReady});
    };
    if(reducedMotion.matches) {arrived();return;}
    schedule(() => {
      surface.dataset.phase = 'descent';
      setStatus(`Descending to ${world.name}`);
      announce('DESCENT IN PROGRESS', 'Engines stabilizing. The astronaut remains inside until touchdown.');
      schedule(() => {
        surface.dataset.phase = 'slide';
        setStatus('Sliding to a stop');
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
      setStatus('Lifting off');
      announce('RETURN TO ORBIT', 'Crew safely aboard. Engines firing for departure.');
      schedule(closeAndLaunch,launchDuration);
    };
    if(board) {
      surface.dataset.phase='boarding';
      setStatus('Returning to the spaceship');
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
