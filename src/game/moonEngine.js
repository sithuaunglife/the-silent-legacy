import {moon} from '../data/moon';
import {createLunarSurface} from './lunarSurface';
import {createArtifactViewer} from './artifactViewer';
import {createLandingSequence} from './landingSequence';

/** Independent Moon exploration, astronaut, scan and jump lifecycle. */
export function mountMoonEngine(surface, onClosed) {
  const terrain = surface.querySelector('.outer-terrain');
  const guide = surface.querySelector('.outer-field-guide');
  const controls = surface.querySelector('.outer-lunar-controls');
  let lunar;
  const viewer = createArtifactViewer('moon', () => lunar);
  lunar = createLunarSurface(surface, terrain, moon.records, viewer.show);
  // Keep canvas labels/counts in sync when the world-level Collect All
  // button records all four artifacts in one transaction.
  const syncCollected=event=>{
    const ids=event.detail?.progress?.moon;
    if(!Array.isArray(ids))return;
    moon.records.forEach((record,index)=>{
      if(ids.includes(record[0]))lunar.markScanned(index);
    });
  };
  window.addEventListener('silent:mission-progress',syncCollected);
  const transitions = createLandingSequence({
    surface, world:moon, onClosed,
    beforeLand(){
      controls.hidden=true;
      guide.hidden=true;
      lunar.paint();
    },
    onLanded({crewReady}){
      lunar.egress(()=>{
        controls.hidden=false;
        crewReady();
      });
    },
    beforeLeave(){controls.hidden=true;guide.hidden=true;},
    board(finish){lunar.board(finish);},
  });
  return {
    land: transitions.land,
    destroy(){window.removeEventListener('silent:mission-progress',syncCollected);transitions.destroy();lunar.destroy();viewer.destroy();},
  };
}
