import {moon} from '../data/moon';
import {createLunarSurface} from './lunarSurface';
import {createArtifactViewer} from './artifactViewer';
import {createLandingSequence} from './landingSequence';

/** Independent Moon exploration, astronaut, scan and jump lifecycle. */
export function mountMoonEngine(surface, onClosed) {
  const terrain = surface.querySelector('.outer-terrain');
  const guide = surface.querySelector('.outer-field-guide');
  const controls = surface.querySelector('.outer-lunar-controls');
  const artifact = surface.nextElementSibling;
  let lunar;
  const viewer = createArtifactViewer(artifact, () => lunar);
  lunar = createLunarSurface(surface, terrain, artifact, moon.records, viewer.show);
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
