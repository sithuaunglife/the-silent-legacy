import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildArchiveModel } from './archiveModels';

/** Independently mounted 360° model. Disposes all WebGL resources on close. */
export default function ArtifactModel({craft}) {
  const mount = useRef(null);
  const model = useRef(null);
  const [yaw,setYaw] = useState(0);
  const [autoplay,setAutoplay] = useState(true);
  const auto = useRef(autoplay);
  useEffect(()=>{auto.current=autoplay;},[autoplay]);
  useEffect(()=>{
    const container = mount.current;
    if (!container) return;
    let renderer;
    try {renderer = new THREE.WebGLRenderer({antialias:false,alpha:true,powerPreference:'low-power'});} catch(err) {
      const fallback=document.createElement('p');fallback.className='archive-canvas-error';fallback.textContent='3D preview unavailable on this device';container.appendChild(fallback);
      return()=>fallback.remove();
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42,1,.1,100);
    camera.position.set(0,.55,6.5);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-label', `${craft.name}, interactive 360-degree concept model`);
    container.appendChild(renderer.domElement);
    const group = new THREE.Group();scene.add(group);
    scene.add(new THREE.AmbientLight(0xa6bddf,2.3));
    const light = new THREE.DirectionalLight(0xffffff,2.8);light.position.set(5,8,8);scene.add(light);
    const accent = new THREE.DirectionalLight(0x00c8ff,2);accent.position.set(-5,2,-5);scene.add(accent);
    const grid = new THREE.GridHelper(5.1,12,0x047ba4,0x12354d);grid.position.y=-1.2;scene.add(grid);
    buildArchiveModel(craft,group);
    let angle=.65, pitch=.18, zoom=6.5, down=false, px=0,py=0,frame=0,last=0;
    const onDown=e=>{down=true;px=e.clientX;py=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)};
    const onMove=e=>{if(!down)return;angle+=(e.clientX-px)*.014;pitch=Math.max(-.75,Math.min(.95,pitch+(e.clientY-py)*.011));px=e.clientX;py=e.clientY};
    const onUp=e=>{down=false;if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId)};
    const onWheel=e=>{e.preventDefault();zoom=Math.max(3.5,Math.min(10,zoom+e.deltaY*.007))};
    const canvas=renderer.domElement;
    canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);canvas.addEventListener('wheel',onWheel,{passive:false});
    const resize=()=>{const w=Math.max(container.clientWidth,100),h=Math.max(container.clientHeight,100);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
    const observer=new ResizeObserver(resize);observer.observe(container);resize();
    const animate=(now)=>{frame=requestAnimationFrame(animate);if(document.hidden) {last=now;return};const delta=Math.min((now-last)/1000 || .016,.04);last=now;if(auto.current&&!down)angle+=delta*.38;group.rotation.set(pitch,angle,0);camera.position.z+=(zoom-camera.position.z)*.12;camera.lookAt(0,0,0);renderer.render(scene,camera);if(Math.floor(now/95)!==Math.floor((now-16)/95))setYaw(Math.round((angle*180/Math.PI%360+360)%360));};
    frame=requestAnimationFrame(animate);
    model.current={reset:()=>{angle=.65;pitch=.18;zoom=6.5}};
    return()=>{cancelAnimationFrame(frame);model.current=null;observer.disconnect();canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onUp);canvas.removeEventListener('wheel',onWheel);group.traverse(x=>{if(x.geometry)x.geometry.dispose();if(x.material){const mat=Array.isArray(x.material)?x.material:[x.material];mat.forEach(m=>m.dispose());}});grid.geometry.dispose();grid.material.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();};
  },[craft]);
  return <div className="archive-model-wrap"><div className="archive-model-label">LOW-POLY 360° CONCEPT <span>YAW: {String(yaw).padStart(3,'0')}°</span></div><div ref={mount} className="archive-model-viewport"/><div className="archive-model-controls"><span>DRAG TO ROTATE · SCROLL TO ZOOM</span><button type="button" onClick={()=>setAutoplay(!autoplay)}>AUTO: {autoplay?'ON':'OFF'}</button><button type="button" onClick={()=>model.current?.reset()}>RESET</button></div></div>;
}
