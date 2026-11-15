import React, {useCallback,useEffect,useRef,useState} from 'react';
import OuterSpace from './components/OuterSpace';
import Moon from './components/Moon';
import Mars from './components/Mars';
import ArchiveDashboard from './components/archive/ArchiveDashboard';
import LaunchSimulator from './components/LaunchSimulator';
import StartScreen from './components/StartScreen';
import './styles/sceneTransition.css';
import { localizeInterface } from './i18n';
import { readMissionProgress, clearMissionProgress, getMissionTotals } from './game/missionProgress';
import './styles/ending.css';
import { isStoryAudioEnabled, setStoryAudioEnabled, unlockStoryAudio, storySound } from './game/storyAudio';

/** One React modal is shared by the Moon and Mars exploration engines. */
export default function App(){
  // Restore the last destination; users never lose their place after refresh.
  const requestedWorld=new URLSearchParams(window.location.search).get('surface');
  const savedWorld=()=>{try{return window.sessionStorage.getItem('silent:world')}catch{return null}};
  const initialWorld=requestedWorld==='moon'||requestedWorld==='mars'
    ? requestedWorld : savedWorld();
  const [world,setWorld]=useState(initialWorld==='moon'||initialWorld==='mars'?initialWorld:null);
  const [language,setLanguage]=useState(()=>{
    try{return window.localStorage.getItem('silent:language')==='my'?'my':'en'}catch{return 'en'}
  });
  // Do not open an archive on first load. Every archive is selected by a click.
  const [selection,setSelection]=useState(null);
  const [launchComplete,setLaunchComplete]=useState(()=>{
    try{return Boolean(initialWorld)||['orbit','ending'].includes(window.sessionStorage.getItem('silent:stage'))}catch{return Boolean(initialWorld)}
  });
  const [startDismissed,setStartDismissed]=useState(()=>launchComplete);
  const [launchKey,setLaunchKey]=useState(0);
  const [launchTransition,setLaunchTransition]=useState(false);
  const handoffTimer=useRef(null);
  const returnTimer=useRef(null);
  const returnPending=useRef(false);
  const returnOriginRef=useRef(null);
  const returnFallbackTimer=useRef(null);
  const [endingOrigin,setEndingOrigin]=useState(()=>{
    try{return window.sessionStorage.getItem('silent:ending-origin')||null}catch{return null}
  });
  const [storyProgress,setStoryProgress]=useState(readMissionProgress);
  const [endingFinished,setEndingFinished]=useState(false);
  const [soundEnabled,setSoundEnabled]=useState(isStoryAudioEnabled);
  const onSoundToggle=useCallback(()=>{
    const next=!soundEnabled;
    setStoryAudioEnabled(next);
    setSoundEnabled(next);
    if(next)unlockStoryAudio();
    storySound('button');
  },[soundEnabled]);
  useEffect(()=>{
    const unlock=()=>{unlockStoryAudio();};
    window.addEventListener('pointerdown',unlock,{capture:true});
    window.addEventListener('keydown',unlock,{capture:true});
    return()=>{
      window.removeEventListener('pointerdown',unlock,{capture:true});
      window.removeEventListener('keydown',unlock,{capture:true});
    };
  },[]);
  useEffect(()=>{
    const cue=(event)=>{
      if(event.detail?.type)storySound(event.detail.type);
    };
    window.addEventListener('silent:story-sfx',cue);
    return()=>window.removeEventListener('silent:story-sfx',cue);
  },[]);

  useEffect(()=>()=>{
    window.clearTimeout(handoffTimer.current);
    window.clearTimeout(returnTimer.current);
    window.clearTimeout(returnFallbackTimer.current);
  },[]);
  useEffect(()=>{
    try{window.localStorage.setItem('silent:language',language)}catch{}
    document.documentElement.lang=language==='my'?'my':'en';
    window.dispatchEvent(new CustomEvent('silent:language-change',{detail:language}));
    return localizeInterface(language);
  },[language]);
  useEffect(()=>{
    try{
      window.sessionStorage.setItem('silent:stage',endingOrigin?'ending':launchComplete?'orbit':'start');
      if(world)window.sessionStorage.setItem('silent:world',world);
      else window.sessionStorage.removeItem('silent:world');
    }catch{}
  },[launchComplete,world,endingOrigin]);
  const archiveRef=useRef(null);
  const land=useCallback((name)=>{
    setWorld(name);
    try{window.sessionStorage.setItem('silent:world',name)}catch{}
  },[]);
  // Both engines signal a closed return, but Moon has a longer astronaut
  // boarding sequence. Preserve final world outside React re-renders.
  const finishReturn=useCallback((origin)=>{
    const finalWorld=origin||returnOriginRef.current;
    if(!returnPending.current || !['moon','mars'].includes(finalWorld))return;
    clearTimeout(returnFallbackTimer.current);
    clearTimeout(returnTimer.current);
    returnPending.current=false;
    returnOriginRef.current=null;
    setWorld(null);
    setEndingOrigin(finalWorld);
    setEndingFinished(false);
    try{
      window.sessionStorage.removeItem('silent:world');
      window.sessionStorage.setItem('silent:ending-origin',finalWorld);
    }catch{}
  },[]);
  const close=useCallback(()=>{
    if(returnPending.current){
      finishReturn(returnOriginRef.current);
    }else setWorld(null);
  },[finishReturn]);
  useEffect(()=>{
    const onDeparture=event=>{
      const origin=event.detail;
      if(returnPending.current && origin===returnOriginRef.current){
        setTimeout(()=>finishReturn(origin),0);
      }
    };
    window.addEventListener('orbit:launch',onDeparture);
    return()=>window.removeEventListener('orbit:launch',onDeparture);
  },[finishReturn]);
  const closeArchive=useCallback(()=>{
    document.documentElement.dataset.silentArchiveOpen='false';
    archiveRef.current?.close();
    setSelection(null);
    window.dispatchEvent(new Event('silent:archive-close'));
  },[]);
  useEffect(()=>{
    const onInspect=event=>{
      const target=event.detail;
      // Voyager 1 is a spaceborne record: only a deliberate ship click opens it.
      if(target.world === 'interstellar') {
        if(world || document.querySelector('.outer-surface[open]')) return;
      } else if(!document.querySelector(`.outer-surface[data-world="${target.world}"]`)?.open) return;
      document.documentElement.dataset.silentArchiveOpen='true';
      setSelection(target);
    };
    window.addEventListener('silent:inspect',onInspect);
    return()=>window.removeEventListener('silent:inspect',onInspect);
  },[world]);
  // Complete the story after BOTH equipment collections are fully scanned.
  // Automatically board the departing ship, then play the Earth-return ending.
  useEffect(()=>{
    const onProgress=event=>{
      const detail=event.detail;
      if(!detail)return;
      setStoryProgress(detail.progress);
      storySound('scan');
      if(!detail.complete || returnPending.current || endingOrigin)return;
      const finalWorld=detail.world;
      if(!['moon','mars'].includes(finalWorld))return;
      returnPending.current=true;
      returnOriginRef.current=finalWorld;
      window.clearTimeout(returnTimer.current);
      window.clearTimeout(returnFallbackTimer.current);
      // Let scanner confirmation finish before boarding from either world.
      returnTimer.current=window.setTimeout(()=>{
        closeArchive();
        returnTimer.current=window.setTimeout(()=>{
          const shipReturn=document.querySelector(
            '.outer-surface[data-world="'+finalWorld+'"][open] .outer-return:not([disabled])'
          );
          if(shipReturn)shipReturn.click();
          else finishReturn(finalWorld);
        },120);
      },1150);
      // Graceful recovery for a stalled animation frame or interrupted Moon
      // boarding sequence: preserve the completed story and final origin.
      returnFallbackTimer.current=window.setTimeout(()=>{
        if(!returnPending.current || returnOriginRef.current!==finalWorld)return;
        const dialog=document.querySelector('.outer-surface[data-world="'+finalWorld+'"]');
        if(dialog?.open)dialog.close();
        finishReturn(finalWorld);
      },10000);
    };
    window.addEventListener('silent:mission-progress',onProgress);
    return()=>window.removeEventListener('silent:mission-progress',onProgress);
  },[closeArchive,endingOrigin,finishReturn]);

  const restartStory=useCallback(()=>{
    window.clearTimeout(handoffTimer.current);
    window.clearTimeout(returnTimer.current);
    window.clearTimeout(returnFallbackTimer.current);
    returnPending.current=false;
    returnOriginRef.current=null;
    clearMissionProgress();
    try {
      sessionStorage.removeItem('silent:ending-origin');
      sessionStorage.removeItem('silent:stage');
      sessionStorage.removeItem('silent:world');
    }catch{}
    // Reset real Moon/Mars scanning engines as well as the visible counters.
    window.location.replace(window.location.pathname);
  },[]);
  useEffect(()=>{
    const onRestart=event=>{
      if(event.origin!==window.location.origin)return;
      if(event.data?.type==='silent-ending-sfx' && ['orbit','touchdown','mission'].includes(event.data.sound)){
        storySound(event.data.sound);
      }else if(event.data?.type==='silent-ending-complete'){
        setEndingFinished(true);
        storySound('victory');
      }else if(event.data?.type==='silent-ending-restart')restartStory();
    };
    window.addEventListener('message',onRestart);
    return()=>window.removeEventListener('message',onRestart);
  },[restartStory]);
  useEffect(()=>{
    if(selection && archiveRef.current && !archiveRef.current.open)archiveRef.current.showModal();
    else if(!selection && archiveRef.current?.open)archiveRef.current.close();
  },[selection]);
  useEffect(()=>{if(!world&&selection&&selection.world!=='interstellar')closeArchive();},[world,selection,closeArchive]);
  const completeLaunch=useCallback(()=>{
    if(launchTransition)return;
    setLaunchTransition(true);
    window.clearTimeout(handoffTimer.current);
    handoffTimer.current=window.setTimeout(()=>{
      setLaunchComplete(true);
      storySound('orbit');
      try{window.sessionStorage.setItem('silent:stage','orbit')}catch{}
    },1800);
  },[launchTransition]);
  const backToStart=useCallback(()=>{
    window.clearTimeout(handoffTimer.current);
    closeArchive();
    setWorld(null);
    setEndingOrigin(null);
    setEndingFinished(false);
    setStoryProgress({moon:[],mars:[]});
    returnPending.current=false;
    returnOriginRef.current=null;
    window.clearTimeout(returnFallbackTimer.current);
    clearMissionProgress();
    try{window.sessionStorage.removeItem('silent:ending-origin')}catch{}
    setLaunchTransition(false);
    setLaunchComplete(false);
    setStartDismissed(false);
    setLaunchKey(key=>key+1);
    try{
      window.sessionStorage.removeItem('silent:world');
      window.sessionStorage.removeItem('silent:stage');
    }catch{}
    if(new URLSearchParams(window.location.search).has('surface')){
      window.history.replaceState(null,'',window.location.pathname);
    }
  },[closeArchive]);
  const toggleLanguage=useCallback(()=>setLanguage(current=>current==='en'?'my':'en'),[]);

  return <>
    {!world && !selection && <button className="mission-sound-toggle" type="button" onClick={onSoundToggle}
      aria-label={soundEnabled?'Mute story sounds':'Enable story sounds'}
      aria-pressed={soundEnabled}>
      {soundEnabled?'🔊':'🔇'} {language==='my'?'အသံ':'SOUND'} {soundEnabled?'ON':'OFF'}
    </button>}
    {(launchComplete || launchTransition) && <main
      id="silent-legacy-outer-space"
      className="scene-space scene-space--visible"
    >
    <OuterSpace onLand={land} language={language}
      onLanguageToggle={toggleLanguage} onBackStart={backToStart}>
      <Moon active={world==='moon'} onClosed={close} soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} language={language}/>
      <Mars active={world==='mars'} onClosed={close} soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} language={language}/>
    </OuterSpace>
    <dialog ref={archiveRef} onCancel={e=>{e.preventDefault();closeArchive();}} className="archive-shell">
      {selection&&<ArchiveDashboard selection={selection} onClose={closeArchive}
        language={language} onLanguageChange={setLanguage}/>}
    </dialog>
    </main>}
    {launchComplete && !endingOrigin && (
      <aside className="mission-progress-pill" aria-live="polite">
        <span>☾ {language==='my'?'လ':'MOON'} {storyProgress.moon.length}/{getMissionTotals().moon}</span>
        <span>◈ {language==='my'?'အင်္ဂါ':'MARS'} {storyProgress.mars.length}/{getMissionTotals().mars}</span>
      </aside>
    )}
    {endingOrigin && (
      <section className="story-ending" aria-label="Story ending — returning to Earth" role="region">
        <iframe src={`/ending/index.html?origin=${endingOrigin}&start=transit&lang=${language}`}
          title="The Silent Legacy — Return to Earth and Story Complete"
          allow="autoplay" />
        {endingFinished && <button className="story-ending-restart" type="button" onClick={restartStory}>
          ↻ {language==='my'?'ဇာတ်လမ်းအစမှ ပြန်စရန်':'Restart Story'}
        </button>}
      </section>
    )}
    {!launchComplete && !startDismissed && <StartScreen onBegin={()=>setStartDismissed(true)} />}
    {!launchComplete && startDismissed && <>
      <LaunchSimulator key={launchKey}
        onComplete={completeLaunch} exiting={launchTransition} language={language} />
      <button className="launch-global-language" type="button"
        aria-label="Switch between English and Myanmar" onClick={toggleLanguage}>
        {language==='en'?'EN / မြန်မာ':'မြန်မာ / EN'}
      </button>
    </>}


  </>;
}
