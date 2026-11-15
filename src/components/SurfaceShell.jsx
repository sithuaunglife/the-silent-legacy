import React, { forwardRef, useEffect, useState } from 'react';
import { collectAllArtifacts, getMissionTotals, readMissionProgress } from '../game/missionProgress.js';
import '../styles/surface.css';

/** Shared visual landing frame; each world supplies its own exploration UI and engine. */
const SurfaceShell = forwardRef(function SurfaceShell({ world, children, soundEnabled, onSoundToggle, language }, ref) {
  const totals=getMissionTotals();
  const [collected,setCollected]=useState(()=>readMissionProgress()[world].length);
  useEffect(()=>{
    const update=event=>{
      if(event.detail?.progress?.[world])setCollected(event.detail.progress[world].length);
    };
    window.addEventListener('silent:mission-progress',update);
    return()=>window.removeEventListener('silent:mission-progress',update);
  },[world]);
  const collect=()=>{
    if(ref?.current?.dataset.phase!=='landed'||collected>=totals[world])return;
    const result=collectAllArtifacts(world);
    if(result)setCollected(result.progress[world].length);
  };
  return <>
    <dialog ref={ref} className="outer-surface" data-world={world} aria-labelledby={`surface-title-${world}`}>
      <button type="button" className="outer-surface-sound" onClick={onSoundToggle}
        aria-pressed={Boolean(soundEnabled)}
        aria-label={soundEnabled?'Mute story sounds':'Enable story sounds'}>
        {soundEnabled?'🔊':'🔇'} {language==='my'?'အသံ':'SOUND'} {soundEnabled?'ON':'OFF'}
      </button>
      <canvas className="outer-terrain" aria-hidden="true" width="440" height="260" />
      <div className="outer-entry-effects" aria-hidden="true"></div>
      <i className="outer-landing-shadow" aria-hidden="true"></i>
      <div className="outer-descent-ship" aria-hidden="true"><i className="outer-descent-thrust"></i><img alt="" width="112" height="112" src="/assets/spaceship-landing-12.webp" /></div>
      <div className="outer-landing-dust" aria-hidden="true"></div>
      <header className="outer-surface-head"><div>
        <h2 id={`surface-title-${world}`} tabIndex={-1}></h2>
        <p className="outer-surface-status" aria-live="polite"></p>
      </div><button className="outer-return cursor-interaction" type="button" disabled>Return to orbit</button></header>
      {children}
      <button type="button" className="outer-collect-all cursor-interaction"
        onClick={collect} disabled={collected>=totals[world]}
        aria-label={language==='my'?(world==='moon'?'လ':'အင်္ဂါဂြိုလ်')+' စက်ပစ္စည်းအားလုံး စုဆောင်းရန်':'Collect all '+world+' artifacts'}>
        {collected>=totals[world]
          ? '✓ '+(language==='my'?'အားလုံးစုဆောင်းပြီး':'COLLECTED')+' '+collected+'/'+totals[world]
          : '✦ '+(language==='my'?'အားလုံးစုဆောင်းရန်':'COLLECT ALL')+' '+totals[world]+'/'+totals[world]}
      </button>
      <section className="outer-mission-dialogue" aria-label="Mission communication" role="status" aria-live="polite" aria-atomic="true" hidden>
        <div className="outer-mission-dialogue-icon" aria-hidden="true"><i /></div>
        <div className="outer-mission-dialogue-text">
          <span className="outer-mission-dialogue-label">MISSION CONTROL <b className="outer-mission-dialogue-signal">● LIVE</b></span>
          <strong className="outer-mission-dialogue-title" />
          <p className="outer-mission-dialogue-body" />
        </div>
        <button type="button" className="outer-mission-dialogue-dismiss" aria-label="Dismiss mission briefing">×</button>
      </section>
      <nav className="outer-direction-pad" aria-label={`${world === 'moon' ? 'Moon' : 'Mars'} movement controls`}>
        <button className="outer-direction-up" type="button" data-move="KeyW" aria-label="Move up">W</button>
        <button className="outer-direction-left" type="button" data-move="KeyA" aria-label="Move left">A</button>
        <button className="outer-direction-down" type="button" data-move="KeyS" aria-label="Move down">S</button>
        <button className="outer-direction-right" type="button" data-move="KeyD" aria-label="Move right">D</button>
      </nav>
      {world==='mars'&&<button type="button" className="outer-mars-jump" aria-keyshortcuts="Space" aria-label="Jump on Mars">SPACE · JUMP</button>}

    </dialog>

  </>;
});
export default SurfaceShell;
