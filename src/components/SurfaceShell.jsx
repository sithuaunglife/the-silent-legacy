import React, { forwardRef } from 'react';
import '../styles/surface.css';

/** Shared visual landing frame; each world supplies its own exploration UI and engine. */
const SurfaceShell = forwardRef(function SurfaceShell({ world, children }, ref) {
  return <>
    <dialog ref={ref} className="outer-surface" data-world={world} aria-labelledby={`surface-title-${world}`}>
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
    </dialog>

  </>;
});
export default SurfaceShell;
