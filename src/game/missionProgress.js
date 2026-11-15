import {moon} from '../data/moon.js';
import {mars} from '../data/mars.js';

const STORE='silent-legacy:story-progress:v1';
const worlds={moon, mars};
const empty=()=>({moon:[],mars:[]});
export function readMissionProgress(){
  try {
    const parsed=JSON.parse(sessionStorage.getItem(STORE)||'null');
    return {
      moon:Array.isArray(parsed?.moon)?parsed.moon.filter(id=>moon.records.some(record=>record[0]===id)):[],
      mars:Array.isArray(parsed?.mars)?parsed.mars.filter(id=>mars.records.some(record=>record[0]===id)):[]
    };
  }catch{return empty();}
}
export const isArtifactScanned=(world,id)=>readMissionProgress()[world]?.includes(id)??false;
export const getMissionTotals=()=>({moon:moon.records.length,mars:mars.records.length});
export function recordArtifactScan(world,id){
  if(!(world in worlds)||!worlds[world].records.some(record=>record[0]===id))return null;
  const progress=readMissionProgress();
  if(!progress[world].includes(id))progress[world].push(id);
  try{sessionStorage.setItem(STORE,JSON.stringify(progress));}catch{}
  const totals=getMissionTotals();
  const complete=Object.keys(totals).every(key=>progress[key].length===totals[key]);
  const detail={world,id,progress,totals,complete};
  window.dispatchEvent(new CustomEvent('silent:mission-progress',{detail}));
  return detail;
}
export function clearMissionProgress(){
  try{sessionStorage.removeItem(STORE);}catch{}
}
