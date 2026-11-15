/** Pixelated Martian landscape. Unmodified terrain algorithm from the original NASA preview. */
export function paintMarsTerrain(canvas, world, siteId = 'sojourner') {
  canvas.width = 440;
  canvas.height = 260;
  function paintTerrain(world) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    const horizon = 137;
    ctx.fillStyle = world.sky;
    ctx.fillRect(0, 0, width, height);
    let seed = 1943;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let y = 10; y < horizon; y += 2) {
      ctx.fillStyle = `rgba(218,108,67,${((y / horizon) ** 2 * .54).toFixed(3)})`;
      ctx.fillRect(0, y, width, 2);
    }
    for (let i = 0; i < 43; i++) {
      ctx.fillStyle = i % 5 ? '#6c5d78' : '#c899a0';
      ctx.fillRect(Math.round(random() * width), Math.round(random() * 72), i % 7 ? 1 : 2, 1);
    }
    for (const [depth, color] of world.ridges.entries()) {
      ctx.fillStyle = color;
      for (let x = 0; x < width; x += 3) {
        const y = Math.round(horizon - 23 + depth * 8 - 5 * Math.sin(x * .029 + depth) - 8 * Math.sin(x * .015 + 1.8 * depth) - random() * 3);
        ctx.fillRect(x, y, 3, height - y);
      }
    }
    for (let y = horizon; y < height; y++) {
      const depth = (y - horizon) / (height - horizon);
      for (let x = 0; x < width; x += 4) {
        const relief = Math.sin(x * .031 + y * .074) * .47 + Math.sin(x * .07 - y * .14) * .34;
        const shade = Math.min(4, Math.max(0, Math.floor(depth * 4 + relief + .6)));
        ctx.fillStyle = world.ground[shade];
        ctx.fillRect(x, y, 4, 1);
      }
    }
    for (let i = 0; i < 660; i++) {
      const spread = random();
      const y = Math.round(horizon + spread * (height - horizon));
      ctx.fillStyle = world.stone[i % world.stone.length];
      ctx.fillRect(Math.round(random() * width), y, 1 + Math.round(random() * spread * 8), 1 + Math.floor(spread * 2));
    }
    // Tall buttes cut against the distant ridge, with stratified sunlit faces.
    // Keep them below horizon to retain the original planet/sky atmosphere.
    const buttes = [
      {x:57,y:164,w:38,h:13}, {x:296,y:157,w:29,h:10},
      {x:405,y:191,w:24,h:9},
    ];
    for(const mound of buttes){
      const {x,y,w,h}=mound;
      ctx.fillStyle='#3a2c3e';
      ctx.beginPath();ctx.moveTo(x-w/2,y);ctx.lineTo(x-w/3,y-h);
      ctx.lineTo(x+w/3,y-h+1);ctx.lineTo(x+w/2,y);ctx.closePath();ctx.fill();
      ctx.fillStyle='#b87254';ctx.fillRect(Math.round(x-w/3),y-h+2,Math.round(w*.6),2);
      ctx.fillStyle='#8d4c42';ctx.fillRect(Math.round(x-w/2+4),y-3,Math.round(w-8),2);
      ctx.fillStyle='#e29b64';ctx.fillRect(Math.round(x-w/3+2),y-h+1,Math.round(w*.3),1);
    }
    // Wind ripples with shaded 2.5D lips; avoid noisy repeating gradients.
    for(let i=0;i<24;i++){
      const y=158+i*5+Math.round(random()*4),x=Math.floor(random()*420)+10;
      const width=Math.floor(8+random()*20),depth=y>220?3:1;
      ctx.fillStyle=i%3===0?'#ad6b4e':'#c47d58';
      ctx.fillRect(x,y,width,1);
      ctx.fillStyle='#502d33';ctx.fillRect(x+4,y+depth,width-7,1);
    }
    // Volcanic rock fragments: highlighted left face, shadowed right face.
    for(let i=0;i<38;i++){
      const x=Math.round(random()*436)+2;
      const y=Math.round(159+random()*96);
      const scale=.5+(y-150)/95;
      const rx=Math.round((2+random()*4)*scale);
      const ry=Math.max(2,Math.round(rx*.4));
      ctx.fillStyle='#452a32ac';ctx.fillRect(x+1,y+1,rx*2+3,ry+2);
      ctx.beginPath();ctx.moveTo(x-rx,y);ctx.lineTo(x-1,y-ry*2);
      ctx.lineTo(x+rx,y-ry);ctx.lineTo(x+rx+1,y);
      ctx.closePath();ctx.fillStyle=i%4===0?'#9d5b49':'#7e5047';ctx.fill();
      ctx.fillStyle='#db9870';ctx.fillRect(x-rx+1,y-ry,Math.max(1,rx),1);
      ctx.fillStyle='#4d2b33';ctx.fillRect(x+2,y-1,Math.max(2,rx),1);
    }
    for (const [cx, cy, rx, ry] of [[84,174,23,5],[353,220,36,9],[52,245,38,8],[390,158,19,4]]) {
      for (let row = -ry; row <= ry; row++) {
        const span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (row / ry) ** 2)));
        ctx.fillStyle = row < 1 ? world.stone[0] : world.stone[1];
        ctx.fillRect(cx - span, cy + row, span * 2, 1);
      }
      // Isometric basin rim: near lip, inner floor, ejecta highlights.
      ctx.fillStyle='#e4a074';
      ctx.fillRect(Math.round(cx-rx*.55),cy-ry-2,Math.max(3,Math.round(rx*1.1)),2);
      ctx.fillStyle='#482733';
      ctx.fillRect(Math.round(cx-rx*.4),cy+ry+2,Math.max(3,Math.round(rx*.9)),2);
    }
    // Every machine has a different historical resting site. These are
    // geology-inspired pixel renditions, not photogrammetry or GIS elevation.
    const horiz = 137;
    const drawFlatRock=(x,y,width,height,light,dark)=>{
      ctx.fillStyle=dark;ctx.fillRect(x+2,y+height,width,3);
      ctx.fillStyle=light;
      ctx.beginPath();ctx.moveTo(x,y+height);ctx.lineTo(x+width*.16,y+1);
      ctx.lineTo(x+width*.72,y);ctx.lineTo(x+width,y+height*.65);
      ctx.lineTo(x+width*.8,y+height);ctx.closePath();ctx.fill();
      ctx.fillStyle=dark;ctx.fillRect(x+width*.38,y+height*.72,width*.57,2);
    };
    if (siteId === 'sojourner') {
      // Ancient catastrophic flooding left a field of rounded transported rocks.
      for(let i=0;i<22;i++) {
        const x=Math.round(15+random()*420),y=Math.round(157+random()*96);
        const rad=2+Math.round(random()*6);
        ctx.fillStyle='#654d49';ctx.fillRect(x-1,y+2,rad*2+2,2);
        ctx.fillStyle=i%4?'#ba9171':'#a8a4a0';
        ctx.beginPath();ctx.ellipse(x,y,rad,Math.max(2,rad*.55),0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#f0bc8a';ctx.fillRect(x-rad+1,y-2,Math.max(1,rad*.65),1);
      }
      for(let i=0;i<6;i++) {
        const y=172+i*13;
        ctx.strokeStyle=i%2?'#885d4c':'#a8775d';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(10,y);ctx.bezierCurveTo(90,y+7,196,y-3,430,y+12);ctx.stroke();
      }
    } else if (siteId === 'spirit') {
      // Spirit's immobilization near Home Plate in the Columbia Hills.
      drawFlatRock(18,166,123,29,'#9d6350','#502e33');
      drawFlatRock(302,182,93,22,'#8b584a','#4b2b35');
      ctx.fillStyle='#dec6a5';ctx.fillRect(173,223,70,8);
      ctx.fillStyle='#cdb38e';ctx.fillRect(177,220,53,3);
      ctx.strokeStyle='#523b32';ctx.lineWidth=3;
      for(let j=0;j<2;j++){
        ctx.beginPath();ctx.moveTo(170,252+j*4);ctx.bezierCurveTo(219,224+j*3,236,224+j*5,277,245+j*4);ctx.stroke();
      }
    } else if (siteId === 'opportunity') {
      // Layered exposed Endeavour crater rim and Perseverance Valley slope.
      for(let n=0;n<7;n++) {
        const y=153+n*5;
        ctx.fillStyle=n%2?'#bb8065':'#75443b';
        ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(110,y+9+n);
        ctx.lineTo(190,y+22+n*2);ctx.lineTo(250,y+34+n*2);
        ctx.lineTo(0,y+8);ctx.closePath();ctx.fill();
      }
      ctx.strokeStyle='#eab68a';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(0,155);ctx.bezierCurveTo(89,170,156,169,232,217);ctx.stroke();
      for(let n=0;n<5;n++)drawFlatRock(265+n*28,188+n*8,24,6,'#a65e4b','#4d3036');
    } else if (siteId === 'ingenuity') {
      // Neretva Vallis final airfield: low tan dunes and wind ripples.
      ctx.fillStyle='#b78266';
      ctx.beginPath();ctx.moveTo(0,209);ctx.quadraticCurveTo(82,177,175,206);
      ctx.quadraticCurveTo(256,229,339,205);ctx.lineTo(440,228);ctx.lineTo(440,260);ctx.lineTo(0,260);ctx.fill();
      ctx.fillStyle='#8b5647';
      for(let n=0;n<22;n++){
        let x=20+n*19;let y=210+12*Math.sin(n*.38);
        ctx.fillRect(x,Math.round(y),11,1);ctx.fillRect(x+4,Math.round(y)+2,8,1);
      }
    } else if (siteId === 'phoenix') {
      // Vastitas Borealis: ice-rich patterned polar ground and shallow trench.
      ctx.fillStyle='#b29e91';ctx.globalAlpha=.16;ctx.fillRect(0,137,440,123);ctx.globalAlpha=1;
      ctx.strokeStyle='#dfb6a0';ctx.lineWidth=1;
      for(let y=162;y<259;y+=23)for(let x=0;x<440;x+=33){
        ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+11,y-3);
        ctx.lineTo(x+28,y+6);ctx.lineTo(x+21,y+17);ctx.stroke();
      }
      ctx.fillStyle='#e3ccbb';ctx.fillRect(156,228,51,4);
      ctx.fillStyle='#4c3337';ctx.fillRect(157,232,51,6);
      ctx.fillStyle='#9a7772';ctx.fillRect(161,235,45,2);
      for(let i=0;i<17;i++){
        let x=Math.round(10+random()*420),y=Math.round(155+random()*97);
        ctx.fillStyle=i%2?'#ead3c0':'#c0b0a2';ctx.fillRect(x,y,3+i%3,1);
      }
    }
    // Composite exploration-gallery ground: touches of sedimentary strata,
    // small volcanic rocks, low dunes and polar-bright pebbles; interpretive
    // scenery only, NOT a geographical claim that these missions shared a site.
    if(siteId==='gallery'){
      ctx.fillStyle='#96604f';
      for(let n=0;n<5;n++){const y=181+n*3;ctx.fillRect(258,y,48-n*3,1);}
      ctx.fillStyle='#b18564';ctx.fillRect(358,210,34,2);
      for(let k=0;k<8;k++){
        const x=25+k*47;const y=236+(k%3)*4;
        ctx.fillStyle=k%2?'#8b5546':'#cf9f78';
        ctx.fillRect(x,y,7,2);ctx.fillRect(x+2,y-2,3,1);
      }
    }
    // Wind-worn layered rock shelves, small polygonal pits and dust sheets.
    // These are stylized geological details, not mapped rover coordinates.
    for (let shelf=0; shelf<9; shelf++) {
      const x=10+(shelf*89+shelf*shelf*17)%425;
      const y=159+(shelf*23+shelf*shelf*5)%80;
      const w=9+(shelf%5)*5;
      ctx.fillStyle='#462b35';ctx.fillRect(x+3,y+5,w+4,3);
      ctx.fillStyle=shelf%2?'#b97b5c':'#c18e69';
      ctx.beginPath();ctx.moveTo(x,y+3);ctx.lineTo(x+5,y-3);
      ctx.lineTo(x+w-5,y-5);ctx.lineTo(x+w+4,y+3);ctx.closePath();ctx.fill();
      ctx.fillStyle='#e0ab77';ctx.fillRect(x+5,y-3,w-10,1);
      ctx.fillStyle='#8c4a3c';ctx.fillRect(x+w-3,y+1,4,3);
    }
    for(let pit=0; pit<32; pit++) {
      const x=7+(pit*67+pit*pit*11)%425;
      const y=153+(pit*37+pit*pit*5)%103;
      const radius=2+pit%4;
      ctx.fillStyle='#e0a273';ctx.fillRect(x-radius,y-2,radius*2,1);
      ctx.fillStyle='#633a38';ctx.fillRect(x-radius+1,y-1,radius*2-2,3);
      ctx.fillStyle='#ad664e';ctx.fillRect(x-radius+2,y+2,radius*2-4,1);
    }
    // Fine two-tone ripple crests taper into the distance. Every ripple is
    // drawn with hard pixel edges so objects stay sharp over the ground.
    for(let row=0;row<11;row++) {
      const y=173+row*8;
      for(let stripe=0;stripe<6;stripe++) {
        const x=(row*21+stripe*77)%435;
        const width=8+(row+stripe)%11;
        ctx.fillStyle='#dc996e';ctx.fillRect(x,y,width,1);
        ctx.fillStyle='#76443e';ctx.fillRect(x+3,y+2,Math.max(1,width-4),1);
      }
    }
    // Broken sweep of old traverse wheel tracks beneath the equipment gallery.
    for(let side=0;side<2;side++) for(let step=0;step<19;step++) {
      const x=116+step*10;
      const y=223+side*4+Math.round(Math.sin(step*.38)*4);
      ctx.fillStyle=side?'#7d4436':'#d49a6b';
      ctx.fillRect(x,y,6,1);
    }
    // Independent wheel ruts and landing-blast scars anchor the machines.
    ctx.strokeStyle='#754335';ctx.lineWidth=1;
    for(let n=0;n<2;n++){
      ctx.beginPath();ctx.moveTo(142,206+n*3);
      ctx.bezierCurveTo(169,212+n*2,173,223+n*2,198,239+n*3);
      ctx.stroke();
    }
    ctx.strokeStyle='#bc7754';
    ctx.beginPath();ctx.ellipse(350,221,32,8,.10,0,Math.PI*2);ctx.stroke();
  }

  paintTerrain(world);
}
