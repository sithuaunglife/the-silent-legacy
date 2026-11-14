import React, {useEffect, useRef} from 'react';
import SurfaceShell from './SurfaceShell';
import {mountMoonEngine} from '../game/moonEngine';
import '../styles/moon.css';

export default function Moon({active, onClosed}) {
  const dialogRef = useRef(null);
  const engine = useRef(null);
  useEffect(() => {
    engine.current=mountMoonEngine(dialogRef.current,onClosed);
    return () => {engine.current?.destroy();engine.current=null;};
  }, [onClosed]);
  useEffect(() => {if(active)engine.current?.land();},[active]);
  return <SurfaceShell world="moon" ref={dialogRef}>
    <div className="outer-field-guide" aria-label="Surface artifacts" role="group" hidden></div>
    <div className="outer-lunar-controls" hidden>
      <p className="outer-lunar-scan-count" aria-live="polite"></p>
      <button className="outer-lunar-card" type="button" aria-keyshortcuts="E">
        <canvas aria-hidden="true" width="44" height="44" />
        <span><strong className="outer-lunar-card-title"></strong><small>Inspect artifact [E]</small></span>
      </button>
      <button className="outer-lunar-jump" aria-keyshortcuts="Space" type="button">Jump</button>
    </div>
  </SurfaceShell>;
}
