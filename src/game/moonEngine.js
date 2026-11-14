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
  const transitions = createLandingSequence({
    surface, world:moon, onClosed,
    beforeLand(){
      controls.hidden=true;
      guide.hidden=true;
      lunar.paint();
    },
    onLanded(){controls.hidden=false;lunar.start();},
    beforeLeave(){controls.hidden=true;guide.hidden=true;},
    board(finish){lunar.board(finish);},
  });
  return {
    land: transitions.land,
    destroy(){transitions.destroy();lunar.destroy();viewer.destroy();},
  };
}
