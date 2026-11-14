import React, {useCallback,useState} from 'react';
import OuterSpace from './components/OuterSpace';
import Moon from './components/Moon';
import Mars from './components/Mars';

/** Flight navigation lives in OuterSpace; each surface manages its own DOM/game state. */
export default function App(){
  const [world,setWorld]=useState(null);
  const land=useCallback((name)=>setWorld(name),[]);
  const close=useCallback(()=>setWorld(null),[]);
  return <main id="silent-legacy-outer-space">
    <OuterSpace onLand={land}>
      <Moon active={world==='moon'} onClosed={close}/>
      <Mars active={world==='mars'} onClosed={close}/>
    </OuterSpace>
  </main>;
}
