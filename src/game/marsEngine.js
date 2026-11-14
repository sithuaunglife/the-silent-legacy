import {mars} from '../data/mars';
import {createArtifactViewer} from './artifactViewer';
import {createLandingSequence} from './landingSequence';
import {paintMarsTerrain} from './marsTerrain';

/** Independent Mars site markers, equipment archive and landing lifecycle. */
export function mountMarsEngine(surface,onClosed) {
  const terrain=surface.querySelector('.outer-terrain');
  const field=surface.querySelector('.outer-mars-field');
  const guide=surface.querySelector('.outer-field-guide');
  const viewer=createArtifactViewer('mars');
  const sites=[[18,76,9],[35,61,7],[68,68,8],[83,80,11]];
  const events=new AbortController();
  const markers=mars.records.map((record,index)=>{
    const button=document.createElement('button');
    button.type='button';
    button.setAttribute('aria-haspopup','dialog');
    const icon=new Image();icon.src=`/assets/surface/${record[0]}.webp`;icon.alt='';
    button.append(icon,record[1]);
    button.addEventListener('click',()=>viewer.show(record),{signal:events.signal});
    const marker=document.createElement('button');
    marker.type='button';marker.className='outer-mars-marker';
    marker.setAttribute('aria-label',`Investigate ${record[1]}`);
    const markerIcon=icon.cloneNode(true);marker.append(markerIcon);
    const [x,y,size]=sites[index];
    marker.style.cssText=`left:${x}%;top:${y}%;--marker-size:${size}%`;
    marker.addEventListener('click',()=>viewer.show(record),{signal:events.signal});
    field.append(marker);
    return button;
  });
  const transitions=createLandingSequence({
    surface,world:mars,onClosed,
    beforeLand(){
      paintMarsTerrain(terrain,mars);
      guide.replaceChildren(...markers);
      guide.hidden=true;
      field.hidden=true;
    },
    onLanded(){guide.hidden=false;field.hidden=false;},
    beforeLeave(){guide.hidden=true;field.hidden=true;},
  });
  return {land:transitions.land,destroy(){transitions.destroy();events.abort();viewer.destroy();}};
}
