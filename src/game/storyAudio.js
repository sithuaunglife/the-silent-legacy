/**
 * Lightweight original 8-bit mission soundtrack/SFX. No network files.
 * A real user gesture unlocks Web Audio; browsers never auto-play unexpectedly.
 */
let context;
let master;
let enabled = (() => {
  try { return window.localStorage.getItem('silent:audio') !== 'off'; }
  catch { return true; }
})();
const AudioContextClass = () => window.AudioContext || window.webkitAudioContext;
export function isStoryAudioEnabled(){ return enabled; }
export function unlockStoryAudio(){
  if (!enabled) return false;
  try {
    if (!context) {
      const Type = AudioContextClass();
      if (!Type) return false;
      context = new Type();
      master = context.createGain();
      master.gain.value = 0.30;
      master.connect(context.destination);
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
    return true;
  } catch { return false; }
}
export function setStoryAudioEnabled(value) {
  enabled = Boolean(value);
  try { window.localStorage.setItem('silent:audio', enabled?'on':'off'); }catch{}
  if (!enabled && master && context) master.gain.setTargetAtTime(0,context.currentTime,.015);
  else if (master && context) master.gain.setTargetAtTime(.30,context.currentTime,.015);
  window.dispatchEvent(new CustomEvent('silent:audio-change',{detail:enabled}));
}
function note(freq,duration=.15,delay=0,wave='triangle',volume=.17,slide=0){
  if(!enabled || !context || context.state!=='running')return;
  const start=context.currentTime+delay;
  const osc=context.createOscillator(),gain=context.createGain();
  osc.type=wave;
  osc.frequency.setValueAtTime(freq,start);
  if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(20,freq+slide),start+duration);
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),start+.014);
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(gain);gain.connect(master);
  osc.start(start);osc.stop(start+duration+.035);
}
export function storySound(kind) {
  if (!enabled) return;
  if (!context) return; // Do not create audio before a permitted user gesture.
  switch(kind){
    case 'button':note(590,.07,0,'square',.08);break;
    case 'scan':note(440,.08,0,'square',.13);note(740,.13,.1,'square',.13);note(990,.22,.23,'triangle',.13);break;
    case 'mission':note(690,.065,0,'sine',.1);note(890,.10,.095,'sine',.1);break;
    case 'touchdown':note(155,.26,0,'triangle',.18,-95);note(500,.14,.23,'sine',.09);break;
    case 'liftoff':note(120,.8,0,'sawtooth',.13,160);break;
    case 'orbit':note(330,.12,0,'triangle',.12);note(494,.18,.13,'triangle',.11);note(660,.28,.30,'triangle',.11);break;
    case 'victory':[392,523,659,784,1047].forEach((n,i)=>note(n,.21,i*.16,'triangle',.13));break;
    default:break;
  }
}
export function disposeStoryAudio(){
  if(context) {const closing=context;context=null;master=null;closing.close().catch(()=>{});}
}
