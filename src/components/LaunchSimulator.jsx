import React, { useEffect, useRef } from 'react';
import '../styles/launchSimulator.css';

/** Yangon launch sequence; the existing canvas simulator runs in an isolated frame. */
export default function LaunchSimulator({ onComplete, exiting = false, language = 'en', soundEnabled = true }) {
  const frameRef = useRef(null);
  const currentSettings=useRef({language,soundEnabled});
  currentSettings.current={language,soundEnabled};
  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage({type:'silent-language',language},window.location.origin);
  }, [language]);
  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage({type:'silent-audio',enabled:soundEnabled},window.location.origin);
  }, [soundEnabled]);
  useEffect(() => {
    const onMessage = (event) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'silent-launch-ready') {
        frameRef.current?.contentWindow?.postMessage({
          type:'silent-language',language:currentSettings.current.language
        },window.location.origin);
        frameRef.current?.contentWindow?.postMessage({
          type:'silent-audio',enabled:currentSettings.current.soundEnabled
        },window.location.origin);
      }
      if (event.data?.type === 'silent-launch-orbit') onComplete();
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onComplete]);

  return (
    <section className={`launch-gateway${exiting ? ' launch-gateway--exiting' : ''}`} aria-label="Spaceplane launch from Earth">
      <iframe
        ref={frameRef}
        className="launch-gateway__frame"
        src={`${import.meta.env.BASE_URL}launch/index.html`}
        title="The Silent Legacy spaceplane launch"
        onLoad={() => {
          frameRef.current?.contentWindow?.postMessage(
            {type:'silent-language',language},window.location.origin
          );
          frameRef.current?.contentWindow?.postMessage(
            {type:'silent-audio',enabled:soundEnabled},window.location.origin
          );
        }}
      />
    </section>
  );
}
