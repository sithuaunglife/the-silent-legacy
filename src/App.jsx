import React, {useCallback,useEffect,useRef,useState} from 'react';
import OuterSpace from './components/OuterSpace';
import Moon from './components/Moon';
import Mars from './components/Mars';
import ArchiveDashboard from './components/archive/ArchiveDashboard';
import LaunchSimulator from './components/LaunchSimulator';
import StartScreen from './components/StartScreen';
import './styles/sceneTransition.css';
import { localizeInterface, translate } from './i18n';

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
    try{return Boolean(initialWorld)||window.sessionStorage.getItem('silent:stage')==='orbit'}catch{return Boolean(initialWorld)}
  });
  const [startDismissed,setStartDismissed]=useState(()=>launchComplete);
  const [launchKey,setLaunchKey]=useState(0);
  const [launchTransition,setLaunchTransition]=useState(false);
  const [orbitTransitionVisible,setOrbitTransitionVisible]=useState(false);
  const handoffTimer=useRef(null);
  const entryTimer=useRef(null);
  useEffect(()=>()=>{
    window.clearTimeout(handoffTimer.current);
    window.clearTimeout(entryTimer.current);
  },[]);
  useEffect(()=>{
    try{window.localStorage.setItem('silent:language',language)}catch{}
    document.documentElement.lang=language==='my'?'my':'en';
    window.dispatchEvent(new CustomEvent('silent:language-change',{detail:language}));
    return localizeInterface(language);
  },[language]);
  useEffect(()=>{
    try{
      window.sessionStorage.setItem('silent:stage',launchComplete?'orbit':'start');
      if(world)window.sessionStorage.setItem('silent:world',world);
      else window.sessionStorage.removeItem('silent:world');
    }catch{}
  },[launchComplete,world]);
  const archiveRef=useRef(null);
  const land=useCallback((name)=>{
    setWorld(name);
    try{window.sessionStorage.setItem('silent:world',name)}catch{}
  },[]);
  const close=useCallback(()=>setWorld(null),[]);
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
  useEffect(()=>{
    if(selection && archiveRef.current && !archiveRef.current.open)archiveRef.current.showModal();
    else if(!selection && archiveRef.current?.open)archiveRef.current.close();
  },[selection]);
  useEffect(()=>{if(!world&&selection&&selection.world!=='interstellar')closeArchive();},[world,selection,closeArchive]);
  const completeLaunch=useCallback(()=>{
    if(launchTransition)return;
    setLaunchTransition(true);
    setOrbitTransitionVisible(true);
    window.clearTimeout(handoffTimer.current);
    handoffTimer.current=window.setTimeout(()=>{
      setLaunchComplete(true);
      try{window.sessionStorage.setItem('silent:stage','orbit')}catch{}
      entryTimer.current=window.setTimeout(()=>setOrbitTransitionVisible(false),220);
    },1700);
  },[launchTransition]);
  const backToStart=useCallback(()=>{
    window.clearTimeout(handoffTimer.current);
    window.clearTimeout(entryTimer.current);
    closeArchive();
    setWorld(null);
    setLaunchTransition(false);
    setOrbitTransitionVisible(false);
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
    {(launchComplete || launchTransition) && <main
      id="silent-legacy-outer-space"
      className="scene-space scene-space--visible"
    >
    <OuterSpace onLand={land} language={language}
      onLanguageToggle={toggleLanguage} onBackStart={backToStart}>
      <Moon active={world==='moon'} onClosed={close}/>
      <Mars active={world==='mars'} onClosed={close}/>
    </OuterSpace>
    <dialog ref={archiveRef} onCancel={e=>{e.preventDefault();closeArchive();}} className="archive-shell">
      {selection&&<ArchiveDashboard selection={selection} onClose={closeArchive}
        language={language} onLanguageChange={setLanguage}/>}
    </dialog>
    </main>}
    {!launchComplete && !startDismissed && <StartScreen onBegin={()=>setStartDismissed(true)} />}
    {!launchComplete && startDismissed && <>
      <LaunchSimulator key={launchKey}
        onComplete={completeLaunch} exiting={launchTransition} language={language} />
      <button className="launch-global-language" type="button"
        aria-label="Switch between English and Myanmar" onClick={toggleLanguage}>
        {language==='en'?'EN / မြန်မာ':'မြန်မာ / EN'}
      </button>
    </>}
    {orbitTransitionVisible && <div className="earth-orbit-transition" aria-hidden="true">
      <div className="earth-orbit-transition__planet" role="img" aria-label="Earth"/>
      <img className="earth-orbit-transition__ship" src="/launch/assets/spacecraft-upright.png" alt="" />
      <div className="earth-orbit-transition__beam"/>
      <div className="earth-orbit-transition__caption">{translate(language,'EARTH DEPARTURE')} <span>→</span> {translate(language,'OUTER SPACE')}</div>
      <div className="earth-orbit-transition__sub">{translate(language,'ORBIT INSERTION COMPLETE • CONTINUING MISSION')}</div>
    </div>}

  </>;
}
