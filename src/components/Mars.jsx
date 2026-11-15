import React, {useEffect, useRef} from 'react';
import SurfaceShell from './SurfaceShell';
import {mountMarsEngine} from '../game/marsEngine';
import '../styles/mars.css';

export default function Mars({active,onClosed,soundEnabled,onSoundToggle,language}) {
  const dialogRef=useRef(null);
  const engine=useRef(null);
  useEffect(()=>{
    engine.current=mountMarsEngine(dialogRef.current,onClosed);
    return ()=>{engine.current?.destroy();engine.current=null;};
  },[onClosed]);
  useEffect(()=>{if(active)engine.current?.land();},[active]);
  return <SurfaceShell world="mars" ref={dialogRef} soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} language={language}>
    <div className="outer-site-nav" aria-label="Choose Martian final resting site" role="group"></div>
    <div className="outer-lunar-controls outer-mars-controls" hidden>
      <p className="outer-lunar-scan-count" aria-live="polite"></p>
      <button className="outer-lunar-card outer-mars-card" type="button" aria-keyshortcuts="E" hidden>
        <canvas aria-hidden="true" width="44" height="44" />
        <span><strong className="outer-lunar-card-title"></strong><small>Inspect artifact [E]</small></span>
      </button>
    </div>
    <div className="outer-mars-field" aria-label="Mars surface equipment" role="group" hidden></div>
    <div className="outer-field-guide" aria-label="Surface artifacts" role="group" hidden></div>
  </SurfaceShell>;
}
