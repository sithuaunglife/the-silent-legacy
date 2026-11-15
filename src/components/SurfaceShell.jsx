import React, { forwardRef } from 'react';
import '../styles/surface.css';

/** Full-viewport Moon / Mars expedition, with shared mission radio and touch navigation. */
const SurfaceShell = forwardRef(function SurfaceShell({ world, children }, ref) {
  return (
    <dialog ref={ref} className="outer-surface" data-world={world} aria-labelledby={`surface-title-${world}`}>
      <canvas className="outer-terrain" aria-hidden="true" width="440" height="260" />
      <div className="outer-entry-effects" aria-hidden="true" />
      <i className="outer-landing-shadow" aria-hidden="true" />
      <div className="outer-descent-ship" aria-hidden="true">
        <i className="outer-descent-thrust" />
        <img alt="" width="112" height="112" src="/assets/spaceship-landing-12.webp" />
      </div>
      <div className="outer-landing-dust" aria-hidden="true" />
      <header className="outer-surface-head">
        <div>
          <h2 id={`surface-title-${world}`} tabIndex={-1} />
          <p className="outer-surface-status" aria-live="polite" />
        </div>
        <button className="outer-return cursor-interaction" type="button" disabled>Return to orbit</button>
      </header>
      {children}
      <aside className="outer-mission-comms" aria-live="polite" aria-atomic="true">
        <span className="outer-mission-label"><span aria-hidden="true">◈</span> MISSION CONTROL <span className="outer-mission-live">LIVE</span></span>
        <p className="outer-mission-message">Establishing descent telemetry…</p>
      </aside>
      <div className="outer-movement-pad" role="group" aria-label="Astronaut movement controls">
        <span className="outer-movement-caption">MOVE · WASD</span>
        <div className="outer-movement-grid">
          <button type="button" data-move="KeyW" aria-label="Move forward">↑</button>
          <button type="button" data-move="KeyA" aria-label="Move left">←</button>
          <button type="button" data-move="KeyS" aria-label="Move backward">↓</button>
          <button type="button" data-move="KeyD" aria-label="Move right">→</button>
        </div>
      </div>
    </dialog>
  );
});
export default SurfaceShell;
