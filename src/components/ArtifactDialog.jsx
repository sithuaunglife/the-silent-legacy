import React from 'react';

/** Shared NASA source viewer. Each world owns its own instance. */
export default function ArtifactDialog({ world }) {
  return <dialog className="outer-artifact" aria-labelledby={`artifact-title-${world}`}>
    <form method="dialog"><button aria-label="Close artifact" className="outer-close cursor-interaction" type="submit">×</button></form>
    <h2 id={`artifact-title-${world}`}></h2>
    <figure><img className="outer-artifact-photo" alt="" /><figcaption className="outer-artifact-credit"></figcaption></figure>
    <p className="outer-artifact-copy"></p>
    <a className="outer-artifact-source" rel="noopener noreferrer" target="_blank">NASA mission ↗</a>
    <div className="outer-artifact-scan" hidden>
      <progress aria-label="Artifact scan progress" hidden max="1" value="0" />
      <p aria-live="polite" className="outer-scan-status"></p>
      <button className="outer-scan-button" type="button">Run scan</button>
    </div>
  </dialog>;
}
