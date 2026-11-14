import React, {useCallback,useEffect,useRef,useState} from 'react';
import OuterSpace from './components/OuterSpace';
import Moon from './components/Moon';
import Mars from './components/Mars';
import ArchiveDashboard from './components/archive/ArchiveDashboard';

/** One React modal is shared by the Moon and Mars exploration engines. */
export default function App(){
  // Direct preview links may open a planet; normal visits still start in orbit.
  const [world,setWorld]=useState(()=>{
    const previewWorld=new URLSearchParams(window.location.search).get('surface');
    return previewWorld==='mars'||previewWorld==='moon'?previewWorld:null;
  });
  // Do not open an archive on first load. Every archive is selected by a click.
  const [selection,setSelection]=useState(null);
  const archiveRef=useRef(null);
  const land=useCallback((name)=>setWorld(name),[]);
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
  return <main id="silent-legacy-outer-space">
    <OuterSpace onLand={land}>
      <Moon active={world==='moon'} onClosed={close}/>
      <Mars active={world==='mars'} onClosed={close}/>
    </OuterSpace>
    <dialog ref={archiveRef} onCancel={e=>{e.preventDefault();closeArchive();}} className="archive-shell">
      {selection&&<ArchiveDashboard selection={selection} onClose={closeArchive}/>}
    </dialog>
  </main>;
}
