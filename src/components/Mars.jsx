import React, {useEffect, useRef} from 'react';
import SurfaceShell from './SurfaceShell';
import {mountMarsEngine} from '../game/marsEngine';
import '../styles/mars.css';

export default function Mars({active,onClosed}) {
  const dialogRef=useRef(null);
  const engine=useRef(null);
  useEffect(()=>{
    engine.current=mountMarsEngine(dialogRef.current,onClosed);
    return ()=>{engine.current?.destroy();engine.current=null;};
  },[onClosed]);
  useEffect(()=>{if(active)engine.current?.land();},[active]);
  return <SurfaceShell world="mars" ref={dialogRef}>
    <p className="outer-gallery-note">Interactive NASA artifact gallery · real resting sites are separate</p>
    <div className="outer-site-nav" aria-label="Choose Martian final resting site" role="group"></div>
    <div className="outer-lunar-controls outer-mars-controls" hidden>
      <p className="outer-lunar-scan-count" aria-live="polite"></p>
      <button className="outer-lunar-jump" aria-keyshortcuts="Space" type="button">Jump</button>
    </div>
    <div className="outer-mars-field" aria-label="Mars surface equipment" role="group" hidden></div>
    <div className="outer-field-guide" aria-label="Surface artifacts" role="group" hidden></div>
  </SurfaceShell>;
}
