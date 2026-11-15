import {recordArtifactScan,isArtifactScanned} from '../../game/missionProgress.js';
import React, { useEffect, useState } from 'react';
import PixelArtifactViewer, { archiveAssetFallback, assetUrl } from './PixelArtifactViewer';
import { matchArtifact } from '../../data/archiveCatalog';
import { siteFor } from '../../data/missionSites';
import '../../styles/archiveDashboard.css';

const copy = {
  en: {
    overview: 'MISSION DATA', photo: 'NASA PHOTOS', model: '2.5D PIXEL',
    goal: 'OBJECTIVE', discovery: 'DISCOVERY', challenge: 'CHALLENGE', legacy: 'LEGACY',
    expand: 'MORE MISSION DETAILS', collapse: 'LESS DETAILS', timeline: 'MISSION TIMELINE',
    visit: 'NASA MISSION SOURCE ↗', return: 'BACK TO EXPLORATION', scan: 'SCAN THIS ARTIFACT',
  },
  my: {
    overview: 'မစ်ရှင်အချက်အလက်', photo: 'NASA ဓာတ်ပုံများ', model: '2.5D PIXEL',
    goal: 'ရည်မှန်းချက်', discovery: 'တွေ့ရှိချက်', challenge: 'စိန်ခေါ်မှု', legacy: 'သမိုင်းဝင်အမွေအနှစ်',
    expand: 'အသေးစိတ်ဖတ်ရန်', collapse: 'အသေးစိတ်ပိတ်ရန်', timeline: 'မစ်ရှင်အချိန်ဇယား',
    visit: 'NASA မစ်ရှင်မှတ်တမ်း ↗', return: 'ဂြိုလ်ပေါ် ပြန်သွားရန်', scan: 'စက်ကို SCAN လုပ်ရန်',
  },
};

function MissionImage({ src, surfaceId, alt, ...props }) {
  const fallback = archiveAssetFallback(`${surfaceId || 'sojourner'}-nasa`);
  const [current, setCurrent] = useState(src);
  useEffect(() => setCurrent(src), [src]);
  const onError = () => {
    if (current !== fallback) setCurrent(fallback);
    else setCurrent('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="540" height="290"><rect width="100%" height="100%" fill="#081322"/><text x="50%" y="50%" text-anchor="middle" fill="#8cb9d5" font-size="16" font-family="monospace">NASA PHOTO UNAVAILABLE</text></svg>'
    ));
  };
  return <img src={current} alt={alt} loading="lazy" onError={onError} {...props} />;
}

function MissionPhotos({ craft }) {
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState(false);
  useEffect(() => { setIndex(0); setFull(false); }, [craft.id]);
  const photos = craft.photos || [];
  if (!photos.length) return <div className="archive-photo-empty">No archival image available.</div>;
  const photo = photos[Math.min(index, photos.length - 1)];
  const move = (step) => setIndex(v => (v + step + photos.length) % photos.length);
  const fallback = craft.surfaceId ? assetUrl(`${craft.surfaceId}-nasa`) : undefined;
  return <div className="archive-single-photos">
    <div className="archive-single-photo-viewport">
      <MissionImage src={photo.url || fallback} surfaceId={craft.surfaceId} alt={photo.caption} onClick={() => setFull(true)} />
      {photos.length > 1 && <><button type="button" aria-label="Previous photo" className="archive-photo-prev" onClick={() => move(-1)}>‹</button><button type="button" aria-label="Next photo" className="archive-photo-next" onClick={() => move(1)}>›</button></>}
      <span className="archive-photo-count">NASA IMAGE {index + 1} / {photos.length}</span>
    </div>
    <div className="archive-single-photo-credit"><span>{photo.caption}</span><small>© {photo.credit}</small></div>
    {full && <div className="archive-photo-overlay" role="dialog" aria-modal="true" aria-label="Expanded mission image" onClick={() => setFull(false)}><button aria-label="Close full photo" onClick={() => setFull(false)}>✕ CLOSE PHOTO</button><MissionImage src={photo.url || fallback} surfaceId={craft.surfaceId} alt={photo.caption} /><p>{photo.caption}</p></div>}
  </div>;
}

/** Selected-item-only panel. No archive carousel, no cross-world filter, no other equipment. */
export default function ArchiveDashboard({ selection, onClose, language='en', onLanguageChange=()=>{} }) {
  const craft = selection ? matchArtifact(selection.world, selection.id) : null;
  const [tab, setTab] = useState('pixel');
  const lang = language;
  const setLang = onLanguageChange;
  const [expanded, setExpanded] = useState(false);
  const [phase, setPhase] = useState(0);
  const [scanStatus, setScanStatus] = useState('idle');
  useEffect(() => {
    setTab('pixel'); setExpanded(false); setPhase(0);
    setScanStatus(selection?.world && selection?.id && isArtifactScanned(selection.world,selection.id)?'done':'idle');
  }, [selection?.id, selection?.world]);
  useEffect(() => {
    if (scanStatus !== 'scanning') return;
    const id = window.setTimeout(() => {
      selection?.onScan?.();
      recordArtifactScan(selection?.world,selection?.id);
      setScanStatus('done');
    }, 650);
    return () => window.clearTimeout(id);
  }, [scanStatus, selection]);

  if (!selection) return null;
  if (!craft) return <div className="archive-screen"><div className="archive-unknown"><h2>NO MISSION RECORD FOUND</h2><p>This artifact is not yet linked to the NASA mission catalog.</p><button onClick={onClose}>← RETURN</button></div></div>;
  const t = copy[lang];
  const brief = lang === 'my' && craft.briefMy ? craft.briefMy : craft.brief;
  const moon = craft.world === 'MOON';
  const site = siteFor(craft.id === 'apollo15_lrv' ? 'rover' : craft.id === 'surveyor3' ? 'surveyor' : craft.id);
  const chapter = craft.chapters?.[phase];
  const stats = [
    ['ARRIVAL', craft.date], ['ACTIVE', craft.lifespan],
    ['DISTANCE / OPS', craft.distance], ['FINAL LOCATION', site?.label || craft.location],
  ];
  return <div className={`archive-screen archive-single archive-single-${moon ? 'moon' : 'mars'}`} role="region" aria-label={`NASA mission record for ${craft.name}`}>
    <article className="archive-console archive-single-console" data-selected-artifact={craft.id}>
      <header className="archive-single-top">
        <div className="archive-single-brand"><span className="archive-signal" /> THE SILENT LEGACY <span className="archive-brand-trail">/ FIELD ARCHIVE</span></div>
        <div className="archive-single-top-actions"><span className="archive-world-tag">{moon ? '☾ MOON' : '◈ MARS'} · 01 ARTIFACT</span><button type="button" className="archive-lang" onClick={() => setLang(v => v === 'en' ? 'my' : 'en')}>{lang === 'en' ? 'EN / MY' : 'MY / EN'}</button><button type="button" className="archive-exit" onClick={onClose} aria-label="Close mission dashboard">✕</button></div>
      </header>
      <div className="archive-single-heading"><div className="archive-mission-title"><span className="archive-kicker">SELECTED ARTIFACT / {craft.world} • NASA RECORD</span>{!['eagle', 'opportunity'].includes(craft.id) && <h2>{craft.name}</h2>}<p>{craft.subtitle}</p></div><span className={`archive-status archive-status-${craft.statusColor || 'cyan'}`}>{craft.status}</span></div>
      <div className="archive-single-layout">
        <section className="archive-single-visual" aria-label={`${craft.name} 2.5D pixel-art diorama and NASA photographs`}>
          <nav className="archive-single-tabs" aria-label="Archive view"><button type="button" className={tab === 'pixel' ? 'selected' : ''} onClick={() => setTab('pixel')}>▧ {t.model}</button><button type="button" className={tab === 'photo' ? 'selected' : ''} onClick={() => setTab('photo')}>▤ {t.photo} <small>{craft.photos?.length || 0}</small></button></nav>
          <div className="archive-single-view">{tab === 'pixel' ? <PixelArtifactViewer craft={craft} /> : <MissionPhotos craft={craft} />}</div>
          <div className="archive-planet-note"><span className="archive-dot" /><span>{site.region} · FINAL SITE ILLUSTRATION</span><span>2.5D VISUALIZATION</span></div>
        </section>
        <section className="archive-single-info" aria-label={t.overview}>
          <div className="archive-info-subtitle"><strong>◈ {t.overview}</strong><span>NASA ARCHIVE / {craft.imageId || 'MISSION'}</span></div>
          <div className="archive-site-credit"><strong>◉ RESTING SITE</strong><span>{site.label} · {site.region}</span><a href={site.source} target="_blank" rel="noreferrer noopener">NASA SITE SOURCE ↗</a></div>
          <div className="archive-single-stats">{stats.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
          <div className="archive-single-brief"><section><span>01 / {t.goal}</span><p>{brief?.goal}</p></section><section><span>02 / {t.discovery}</span><p>{brief?.discovery}</p></section></div>
          <button type="button" className="archive-more-toggle" onClick={() => setExpanded(v => !v)} aria-expanded={expanded}>{expanded ? '− ' : '+ '}{expanded ? t.collapse : t.expand}<span>{expanded ? '⌃' : '⌄'}</span></button>
          {expanded && <div className="archive-single-extra"><section><span>03 / {t.challenge}</span><p>{brief?.challenge}</p></section><section><span>04 / {t.legacy}</span><p>{brief?.legacy}</p></section></div>}
          <div className="archive-single-timeline"><div className="archive-timeline-header"><strong>{t.timeline}</strong><div>{(craft.chapters || []).map((part, i) => <button type="button" key={part.code} className={phase === i ? 'selected' : ''} aria-label={`Show mission phase ${i + 1}`} onClick={() => setPhase(i)}>{String(i + 1).padStart(2, '0')}</button>)}</div></div><div className="archive-timeline-content"><small>{chapter?.code}</small><strong>{chapter?.title}</strong><p>{chapter?.text}</p></div></div>
          <div className="archive-single-footer"><a href={craft.nasa} target="_blank" rel="noreferrer noopener">{t.visit}</a>{(moon || craft.world === 'MARS') && <button type="button" disabled={scanStatus !== 'idle'} onClick={() => setScanStatus('scanning')}>{scanStatus === 'scanning' ? 'SCANNING…' : scanStatus === 'done' ? 'SCAN COMPLETE ✓' : t.scan}</button>}</div>
        </section>
      </div>
      <footer className="archive-single-bottom"><span>◆ ARTWORK: PIXEL-ART INTERPRETATION · NOT NASA'S PHYSICAL 3D MODEL</span><button type="button" onClick={onClose}>← {t.return}</button></footer>
    </article>
  </div>;
}
