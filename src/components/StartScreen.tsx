import React, { useEffect, useRef, useState } from 'react';
import { mountStartScreenStars } from '../game/startScreenStars.js';
import '../styles/startScreen.css';

type StartScreenProps = {
  onBegin: () => void;
};

const planetNotes = {
  earth: 'EARTH · The beginning of our exploration journey.',
  moon: 'MOON · Apollo descent stages, lunar rovers, and abandoned instruments.',
  mars: 'MARS · NASA rovers, landers, and missions on the red planet.',
};

const asset = (file: string) => `${import.meta.env.BASE_URL}assets/start/${file}`;

/**
 * Approved 2.5D pixel-art landing screen.
 * BEGIN THE JOURNEY hands control to the existing React LaunchSimulator.
 */
export default function StartScreen({ onBegin }: StartScreenProps) {
  const appRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!appRef.current || !sceneRef.current || !canvasRef.current) return;
    return mountStartScreenStars(canvasRef.current, sceneRef.current, appRef.current);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNotice(null);
      if (
        event.key === 'Enter' &&
        (event.target === document.body || event.target === document.documentElement)
      ) {
        onBegin();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onBegin]);

  return (
    <main
      ref={appRef}
      className='nasa-start app'
      data-i18n-ignore='true'
      lang='en'
      aria-label='The Silent Legacy 2.5D pixel archive start screen'
    >
      <canvas ref={canvasRef} id='stars' aria-hidden='true' />
      <div aria-hidden='true' className='grain' />
      <div aria-hidden='true' className='frame-outline' />

      <div ref={sceneRef} id='scene' className='scene'>
        <div className='title-block'>
          <img
            className='title-art'
            src={asset('title.png')}
            alt='The Silent Legacy'
            draggable={false}
            width={500}
            height={209}
          />
        </div>

        <div aria-hidden='true' className='light-ring ring-one' />
        <div aria-hidden='true' className='light-ring ring-two' />
        <div aria-hidden='true' className='light-ring ring-three' />

        <button
          aria-label='Moon — learn about archived lunar equipment'
          className='planet'
          id='moon'
          type='button'
          onClick={() => setNotice(planetNotes.moon)}
        >
          <img alt='2.5D pixel-art Moon' draggable={false} src={asset('moon.png')} />
        </button>
        <button
          aria-label='Earth — launch origin'
          className='planet'
          id='earth'
          type='button'
          onClick={() => setNotice(planetNotes.earth)}
        >
          <img alt='2.5D pixel-art Earth' draggable={false} src={asset('earth.png')} />
        </button>
        <button
          aria-label='Mars — learn about archived rovers and landers'
          className='planet'
          id='mars'
          type='button'
          onClick={() => setNotice(planetNotes.mars)}
        >
          <img alt='2.5D pixel-art Mars' draggable={false} src={asset('mars.png')} />
        </button>

        <div aria-label='Voyager spacecraft' className='voyager'>
          <span className='track' />
          <img alt='2.5D pixel Voyager probe' draggable={false} src={asset('voyager.png')} />
        </div>

        {['s1', 's2', 's3', 's4', 's5'].map((id) => (
          <div aria-hidden='true' className={`spark ${id}`} key={id}>
            <i />
          </div>
        ))}
      </div>

      <section aria-label='Mission entry' className='lower'>
        <button className='launch-cta' type='button' onClick={onBegin}>
          BEGIN THE JOURNEY
        </button>
      </section>

      <div aria-hidden='true' className='scanlines' />
      {notice && (
        <aside className='notice' role='status'>
          <span>{notice}</span>
          <button aria-label='Dismiss notice' type='button' onClick={() => setNotice(null)}>
            ✕
          </button>
        </aside>
      )}
    </main>
  );
}
