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
    <div className="outer-mars-field" aria-label="Mars surface equipment" role="group" hidden></div>
    <div className="outer-field-guide" aria-label="Surface artifacts" role="group" hidden></div>
  </SurfaceShell>;
}
