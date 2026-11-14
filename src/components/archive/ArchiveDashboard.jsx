import React, {useEffect,useMemo,useState} from 'react';
import ArtifactModel from './ArtifactModel';
import {archiveCatalog,matchArtifact} from '../../data/archiveCatalog';
import '../../styles/archiveDashboard.css';

const labels = {
  en:{goal:'PRIMARY OBJECTIVE',discovery:'BREAKTHROUGH DISCOVERY',challenge:'CRITICAL CHALLENGE',legacy:'HISTORIC LEGACY',brief:'MISSION EXECUTIVE BRIEF',timeline:'MISSION TIMELINE & ARCHIVAL PHOTO'},
  my:{goal:'အဓိက ရည်မှန်းချက်',discovery:'အရေးပါသော တွေ့ရှိချက်',challenge:'အဓိက စိန်ခေါ်မှု',legacy:'သမိုင်းဝင် အမွေအနှစ်',brief:'မစ်ရှင် အကျဉ်းချုပ်',timeline:'မစ်ရှင် အချိန်ဇယားနှင့် ဓာတ်ပုံ'}
};
function FallbackImage({src, alt='',fallback, ...rest}){
  const [current,setCurrent]=useState(src);
  useEffect(()=>setCurrent(src),[src]);
  return <img src={current} alt={alt} onError={()=>{if(fallback&&current!==fallback)setCurrent(fallback);else setCurrent('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350"><rect width="100%" height="100%" fill="#031021"/><text x="50%" y="50%" fill="#00c8ff" font-family="monospace" text-anchor="middle">NASA ARCHIVE / NO IMAGE</text></svg>`));}} {...rest}/>;
}
function ImageViewer({craft,photoIndex,setPhotoIndex}){
  const photos=craft.photos||[];
  const photo=photos[photoIndex]||photos[0];
  const fallback=craft.surfaceId ? `/assets/surface/${craft.surfaceId}-nasa.webp`:'/assets/archive-inline-1.webp';
  const [lightbox,setLightbox]=useState(false);
  useEffect(()=>{setLightbox(false)},[craft]);
  if(!photo)return <p>No imagery available.</p>;
  const advance=(by)=>setPhotoIndex((photoIndex+by+photos.length)%photos.length);
  return <div className="archive-photo-view"><span className="archive-photo-tag">NASA MISSION PHOTO • {String(photoIndex+1).padStart(2,'0')} / {String(photos.length).padStart(2,'0')}</span><div className="archive-photo-main"><button aria-label="Previous photo" onClick={()=>advance(-1)}>◀</button><FallbackImage src={photo.url} fallback={fallback} alt={photo.caption} onClick={()=>setLightbox(true)}/><button aria-label="Next photo" onClick={()=>advance(1)}>▶</button></div><div className="archive-photo-caption"><strong>{photo.caption}</strong><small>CREDIT: {photo.credit}</small></div><div className="archive-thumbs">{photos.map((item,idx)=><button title={item.caption} key={idx} className={idx===photoIndex?'selected':''} onClick={()=>setPhotoIndex(idx)}><FallbackImage src={item.url} fallback={fallback} alt={'Photo '+(idx+1)}/></button>)}</div>{lightbox&&<div role="dialog" aria-modal="true" aria-label="NASA archival photograph" className="archive-lightbox" onClick={()=>setLightbox(false)}><button onClick={()=>setLightbox(false)}>✕ CLOSE</button><FallbackImage src={photo.url} fallback={fallback} alt={photo.caption}/><p>{photo.caption} · {photo.credit}</p></div>}</div>;
}

/** Mission-specific React dashboard. Opened by events from the Moon and Mars game engines. */
export default function ArchiveDashboard({selection,onClose}) {
  const [filter,setFilter]=useState(selection?.world?.toUpperCase()||'ALL');
  const [craftId,setCraftId]=useState(selection?.id ? (matchArtifact(selection.world,selection.id)?.id||'spirit') : 'spirit');
  const [viewport,setViewport]=useState('3d');
  const [lang,setLang]=useState('en');
  const [photoIndex,setPhotoIndex]=useState(0);
  const [phase,setPhase]=useState(0);
  const [scanned,setScanned]=useState(false);
  const [scanning,setScanning]=useState(false);
  useEffect(()=>{if(!selection)return;setFilter(selection.world.toUpperCase());setCraftId(matchArtifact(selection.world,selection.id)?.id||'spirit');setViewport('3d');setPhotoIndex(0);setPhase(0);setScanned(false);setScanning(false);},[selection]);
  const filtered=useMemo(()=>filter==='ALL'?archiveCatalog:archiveCatalog.filter(c=>c.world===filter),[filter]);
  const craft=filtered.find(c=>c.id===craftId)||filtered[0];
  useEffect(()=>{if(!craft||!selection)return;setCraftId(craft.id);setPhotoIndex(0);setPhase(0);},[craft?.id]);
  useEffect(()=>{if(!selection)return;const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onClose();}else if(e.key==='ArrowLeft'&&!e.target.closest('button')){e.preventDefault();navigate(-1)}else if(e.key==='ArrowRight'&&!e.target.closest('button')){e.preventDefault();navigate(1)}};window.addEventListener('keydown',onKey,true);return()=>window.removeEventListener('keydown',onKey,true);},[selection,filtered,craftId]);
  if(!selection||!craft) return null;
  const idx=Math.max(0,filtered.findIndex(c=>c.id===craft.id));
  const navigate=(step)=>{const next=filtered[(idx+step+filtered.length)%filtered.length];if(next)setCraftId(next.id);};
  const page=labels[lang],info=(lang==='my'&&craft.briefMy)||craft.brief;
  const chapter=craft.chapters?.[phase]||craft.chapters?.[0];
  const chooseFilter=(sector)=>{setFilter(sector);const first=(sector==='ALL'?archiveCatalog:archiveCatalog.filter(x=>x.world===sector))[0];if(first)setCraftId(first.id)};
  const scan=()=>{if(scanning)return;setScanning(true);window.setTimeout(()=>{setScanned(true);setScanning(false);if(craft.surfaceId===selection.id)selection.onScan?.();},900)};
  return <div className="archive-screen" role="dialog" aria-modal="true" aria-label={`NASA mission archive: ${craft.name}`}>
    <div className="archive-console">
      <header className="archive-utility"><div className="archive-utility-title"><i/> DEEP SPACE ARCHIVE <span>// TELEMETRY UI</span></div><div className="archive-utility-actions"><span className="archive-sector-label">SECTOR:</span>{[['ALL','ALL'],['MARS','MARS'],['MOON','MOON'],['INTERSTELLAR','DEEP SPACE']].map(([key,name])=><button key={key} className={filter===key?'active':''} onClick={()=>chooseFilter(key)}>{name} <span>({key==='ALL'?archiveCatalog.length:archiveCatalog.filter(x=>x.world===key).length})</span></button>)}<button className="archive-lang" onClick={()=>setLang(lang==='en'?'my':'en')}>{lang==='en'?'EN / MY':'MY / EN'}</button><button onClick={onClose} className="archive-exit" aria-label="Close archive and return to exploration">✕ CLOSE</button></div></header>
      <div className="archive-grid">
        <section className="archive-left" aria-label="Spacecraft viewer"><div className="archive-modes"><button className={viewport==='3d'?'active':''} onClick={()=>setViewport('3d')}>🛰️ 360° 3D MODEL</button><button className={viewport==='photo'?'active':''} onClick={()=>setViewport('photo')}>📷 NASA PHOTOS ({craft.photos?.length||0})</button></div>
          <div className="archive-viewer">{viewport==='3d'?<ArtifactModel key={craft.id} craft={craft}/>:<ImageViewer craft={craft} photoIndex={photoIndex} setPhotoIndex={setPhotoIndex}/>}</div>
          <div className="archive-pager"><button aria-label="Previous craft" onClick={()=>navigate(-1)}>◀</button><div>{filtered.map((c,i)=><button aria-label={`Select ${c.name}`} title={c.name} className={idx===i?'selected':''} onClick={()=>setCraftId(c.id)} key={c.id}/>)}</div><button aria-label="Next craft" onClick={()=>navigate(1)}>▶</button></div>
          <div className="archive-roster">{filtered.map(c=><button onClick={()=>setCraftId(c.id)} key={c.id} className={craft.id===c.id?'selected':''}>{c.name}</button>)}</div>
          <div className="archive-pixel-reference">{craft.surfaceId&&<img src={`/assets/surface/${craft.surfaceId}.webp`} alt={`${craft.name} isometric pixel spacecraft sprite`}/>}<div><strong>2.5D PIXEL SURFACE ASSET</strong><span>In-world model · Isometric pixel illustration</span><small>360° view is a procedural concept model, not a NASA scan.</small></div></div>
        </section>
        <section className="archive-right"><div className="archive-header"><div><p>UNIT {String(idx+1).padStart(2,'0')} / {String(filtered.length).padStart(2,'0')} <b>•</b> {craft.world} ARCHIVE</p><h2>{craft.name}</h2><span>{craft.subtitle}</span></div><div className={`archive-status archive-status-${craft.statusColor||'cyan'}`}>{craft.status}</div></div>
          <div className="archive-stats">{[["LANDING / ARRIVAL",craft.date,null],["ACTIVE LIFESPAN",craft.lifespan,craft.planned],["DISTANCE / OPS",craft.distance,craft.opsSub],["FINAL SITE",craft.location,craft.world]].map(([label,value,sub])=><div key={label}><small>{label}</small><strong>{value}</strong>{sub&&<span>{sub}</span>}</div>)}</div>
          <div className="archive-section-title">{page.brief}<span>READ TIME: 15 SEC</span></div>
          <div className="archive-brief">{['goal','discovery','challenge','legacy'].map((k,i)=><article key={k}><small className={'archive-brief-'+k}>0{i+1} // {page[k]}</small><p>{info?.[k]}</p></article>)}</div>
          <div className="archive-timeline"><div className="archive-section-title">{page.timeline}<div>{craft.chapters?.map((c,i)=><button className={phase===i?'active':''} key={c.code} onClick={()=>{setPhase(i);setPhotoIndex(c.photoIdx||0)}}>{String(i+1).padStart(2,'0')}</button>)}</div></div><article><button aria-label="Open timeline photo" onClick={()=>{setViewport('photo');setPhotoIndex(chapter?.photoIdx||0)}}><FallbackImage src={craft.photos?.[chapter?.photoIdx||0]?.url||''} alt="Mission timeline archive" fallback={craft.surfaceId?`/assets/surface/${craft.surfaceId}-nasa.webp`:''}/><span>VIEW PHOTO ↗</span></button><div><small>{chapter?.code}</small><h3>{chapter?.title}</h3><p>{chapter?.text}</p></div></article></div>
          <footer className="archive-footer"><a href={craft.nasa} target="_blank" rel="noreferrer noopener">NASA SOURCE / MISSION RECORD ↗</a>{selection.world==='moon'&&<button disabled={scanning} onClick={scan}>{scanning?'SCANNING…':scanned?'SCAN COMPLETE ✓':'RUN ARTIFACT SCAN'}</button>}</footer>
        </section>
      </div>
      <div className="archive-bottom-note"><span>THE SILENT LEGACY</span> · An interactive educational visualization — mission data should be checked against the linked NASA record. Spacecraft models are artistic interpretations.</div>
    </div>
  </div>;
}
