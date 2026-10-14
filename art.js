(() => {
  'use strict';
  const canvas = document.querySelector('#art');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) { canvas.setAttribute('aria-label', '描画に対応したブラウザーでご覧ください。'); return; }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, dpr = 1, time = 0, last = 0, frame = 0;
  const speed = .7;
  let paused = reducedMotion.matches;
  let px = .5, py = .5, targetX = .5, targetY = .5;
  let lensX = 0, lensY = 0, lensTargetX = 0, lensTargetY = 0, lensOpacity = 0, lensActive = false;
  const lensBuffer = document.createElement('canvas');
  const lensCtx = lensBuffer.getContext('2d');
  const paper = '#f4f3ee', ink = '#141414';
  const bands = [];
  const words = ['芸術工学部', '小倉悠悟', 'TYPE IN FLUX', 'FORM / TIME / PERCEPTION', '文字は、まだ動いている。', 'ART & DESIGN', 'YUGO OGURA'];
  let seed = 21;
  function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  // Each strip is a typography texture, mapped onto a continuously calculated curve.
  function texture(w, kind, index) {
    const c = document.createElement('canvas'); c.width = w; c.height = 2048;
    const g = c.getContext('2d');
    g.fillStyle = ink;
    if (kind === 'stripe') {
      for (let x = 0; x < w; x += 18) g.fillRect(x, 0, 8, c.height);
    } else if (kind === 'solid') {
      g.fillRect(0, 0, w, c.height);
      g.fillStyle = paper; g.font = `900 ${w * .72}px Arial, sans-serif`;
      g.save();g.translate(w*.16, 35);g.rotate(Math.PI/2);
      for (let j = 0; j < 5; j++) g.fillText('文字と形のあいだ / TYPE IN FLUX', j*680, 0);
      g.restore();
    } else if (kind === 'large') {
      g.save();g.translate(w*.08, 0);g.rotate(Math.PI/2);
      g.font = `900 ${w*.92}px Arial, 'Hiragino Kaku Gothic ProN', sans-serif`;
      const label = words[index % words.length];
      const step = g.measureText(label).width + w*.8;
      for (let y = -step; y < 2048; y += step) g.fillText(label, y, 0);
      g.restore();
    } else {
      const font = kind === 'micro' ? 9 : 13;
      g.font = `500 ${font}px Arial, 'Hiragino Kaku Gothic ProN', sans-serif`;
      for (let x = 0; x < w-font; x += font+5) {
        g.save();g.translate(x+2, 0);g.rotate(Math.PI/2);
        const label = words[(index+x) % words.length] + '　文字 / 時間 / 知覚　';
        const step = g.measureText(label).width;
        for (let y = -step; y < 2048; y += step) g.fillText(label, y, 0);
        g.restore();
      }
    }
    return c;
  }
  const specs = [
    [28,'micro'],[56,'large'],[14,'gap'],[48,'stripe'],[16,'gap'],[40,'micro'],[13,'gap'],[100,'large'],[18,'gap'],[48,'text'],[14,'gap'],[54,'solid'],[12,'gap'],[32,'micro'],[18,'gap'],[70,'large'],[16,'gap'],[80,'stripe'],[20,'gap'],[50,'micro'],[10,'gap'],[105,'large'],[18,'gap'],[48,'text'],[20,'gap'],[70,'solid'],[15,'gap'],[50,'micro'],[15,'gap'],[80,'large'],[20,'gap'],[65,'stripe']
  ];
  let offset = 105;
  specs.forEach(([w, kind], i) => {
    if (kind !== 'gap') bands.push({radius:offset+w/2, w, kind, index:i, texture:texture(w,kind,i), phase:random()*2048, direction:i%3===0?-1:1});
    offset += w;
  });
  function resize() {
    const rect = canvas.getBoundingClientRect();width=rect.width;height=rect.height;
    dpr=Math.min(devicePixelRatio||1, 2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    draw();
  }
  function curve(s, r) {
    const y = s-height*.45;
    const x = (r/1500)*width + Math.sin(y/height*4.1 + time*.2)*width*.2 + Math.sin(y/height*8-time*.13)*width*.05;
    return [x + (px-.5)*55, y];
  }
  function glass() {
    if (lensOpacity < .005) return;
    const radius = Math.min(110, width*.20);
    const diameter = radius*2;
    const bufferSize = Math.ceil(diameter*dpr);
    if (lensBuffer.width !== bufferSize) {
      lensBuffer.width = bufferSize; lensBuffer.height = bufferSize;
    }
    // Snapshot the clean artwork, so refraction never feeds back into itself.
    lensCtx.setTransform(1,0,0,1,0,0);
    lensCtx.fillStyle=paper;lensCtx.fillRect(0,0,bufferSize,bufferSize);
    lensCtx.drawImage(canvas,(lensX-radius)*dpr,(lensY-radius)*dpr,diameter*dpr,diameter*dpr,0,0,bufferSize,bufferSize);
    ctx.save();
    ctx.globalAlpha=lensOpacity;
    ctx.beginPath();ctx.arc(lensX,lensY,radius,0,Math.PI*2);
    ctx.shadowColor='rgba(0,0,0,.16)';ctx.shadowBlur=22;ctx.shadowOffsetY=7;
    ctx.fillStyle='rgba(255,255,255,.05)';ctx.fill();
    ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.clip();
    // Thin scanlines vary the magnification over the convex glass surface.
    for (let row=-radius;row<radius;row+=1.5) {
      const sphere=Math.sqrt(Math.max(0,1-(row/radius)**2));
      const magnification=1.08+.24*sphere;
      const sourceY=(radius+row/magnification)*dpr;
      const sourceWidth=bufferSize/magnification;
      ctx.drawImage(lensBuffer,(bufferSize-sourceWidth)/2,sourceY,sourceWidth,1.6*dpr/magnification,lensX-radius,lensY+row,diameter,1.6);
    }
    const light=ctx.createLinearGradient(lensX-radius,lensY-radius,lensX+radius,lensY+radius);
    light.addColorStop(0,'rgba(255,255,255,.20)');light.addColorStop(.45,'rgba(255,255,255,.015)');light.addColorStop(1,'rgba(0,0,0,.045)');
    ctx.fillStyle=light;ctx.fillRect(lensX-radius,lensY-radius,diameter,diameter);
    ctx.restore();
    ctx.save();ctx.globalAlpha=lensOpacity;
    const rim=ctx.createLinearGradient(lensX-radius,lensY-radius,lensX+radius,lensY+radius);
    rim.addColorStop(0,'rgba(255,255,255,.95)');rim.addColorStop(.42,'rgba(255,255,255,.28)');rim.addColorStop(.65,'rgba(0,0,0,.10)');rim.addColorStop(1,'rgba(255,255,255,.70)');
    ctx.strokeStyle=rim;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(lensX,lensY,radius-1,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(lensX,lensY,radius-5,Math.PI*1.12,Math.PI*1.66);ctx.stroke();ctx.restore();
  }
  function draw() {
    if (!width || !height) return;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=paper;ctx.fillRect(0,0,width,height);
    const scale = width/1500;
    const step = width<640 ? 7 : 6;
    for (const b of bands) {
      const bw=b.w*scale;
      const length=height*1.8;
      const flow=time*(b.kind==='micro'?29:20)*b.direction+b.phase;
      let arcOffset=0;
      for (let s=0;s<length;s+=step) {
        const [x,y]=curve(s,b.radius);
        const [nx,ny]=curve(s+step,b.radius);
        const segmentLength=Math.hypot(nx-x,ny-y);
        arcOffset+=segmentLength;
        if(x < -bw || x > width+bw || y < -bw || y > height+bw) continue;
        const normalWidth=bw*step/segmentLength;
        const angle=Math.atan2(ny-y,nx-x)-Math.PI/2;
        const source=((arcOffset/scale+flow)%2040+2040)%2040;
        const sh=Math.min((segmentLength+.6)/scale,2048-source);
        ctx.save();ctx.translate(x,y);ctx.rotate(angle);
        ctx.drawImage(b.texture,0,source,b.w,sh,-normalWidth/2,0,normalWidth,segmentLength+.6);ctx.restore();
      }
    }
    glass();
  }

  function tick(now) {
    frame=0;
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;
    if (!paused) time+=dt*speed;
    px+=(targetX-px)*.035;py+=(targetY-py)*.035;
    lensX+=(lensTargetX-lensX)*.19;lensY+=(lensTargetY-lensY)*.19;
    lensOpacity+=((lensActive?1:0)-lensOpacity)*.12;
    draw();
    if (!paused && !document.hidden) frame=requestAnimationFrame(tick);
  }
  function start(){if(!frame&&!paused&&!document.hidden){last=0;frame=requestAnimationFrame(tick);}}
  function moveLens(event) {
    const r=canvas.getBoundingClientRect();
    lensTargetX=event.clientX-r.left;lensTargetY=event.clientY-r.top;
    targetX=lensTargetX/r.width;targetY=lensTargetY/r.height;
    if(!lensActive){lensX=lensTargetX;lensY=lensTargetY;}
    lensActive=true;
    if(paused){px=targetX;py=targetY;lensX=lensTargetX;lensY=lensTargetY;lensOpacity=1;draw();}
  }
  function hideLens(){lensActive=false;targetX=.5;targetY=.5;if(paused){lensOpacity=0;draw();}}
  canvas.addEventListener('pointermove',moveLens);
  canvas.addEventListener('pointerdown',moveLens);
  canvas.addEventListener('pointerleave',hideLens);
  canvas.addEventListener('pointercancel',hideLens);
  canvas.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse')hideLens();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();});
  reducedMotion.addEventListener('change',e=>{paused=e.matches;if(paused){cancelAnimationFrame(frame);frame=0;draw();}else start();});
  new ResizeObserver(resize).observe(canvas);
  resize();start();
})();
