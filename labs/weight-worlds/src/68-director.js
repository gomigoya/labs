// Presentation consumes the single Q state. It never awards completion.
const DIRECTOR={
  clock:0,eventLeft:0,snapshot:null,refit:false,
  clear(){this.eventLeft=0;this.snapshot=null;this.offsetAfter=false;controls.enabled=true;qOverlay.innerHTML='';document.body.classList.remove('q-event');},
  intro(){shot(0,S.vertical);},
  push(){this.refit=true;},
  event(s){this.eventLeft=1.4;this.snapshot=JSON.parse(JSON.stringify(s));this.sound([220,330],.45);},
  time(dt){return dt*(this.eventLeft>0&&!Q.free?.18:1)*(T.slow ? 0.25 : 1);},
  sound(notes,duration=.35){
    if(!S.sound.target)return;
    audioContext||=new(window.AudioContext||window.webkitAudioContext)();void audioContext.resume();
    const now=audioContext.currentTime;
    for(const freq of notes){const o=audioContext.createOscillator(),g=audioContext.createGain();o.frequency.value=freq;g.gain.setValueAtTime(.025/notes.length,now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g).connect(audioContext.destination);o.start();o.stop(now+duration);}
  },
  chord(){this.sound([523.25,659.25,783.99],.7);},
  fit(animate=false){
    // Reserve the actual DOM bands, including cards and the expanded free-mode layer group.
    const top=document.getElementById('mission').getBoundingClientRect().bottom+12;
    let bottom=document.body.classList.contains('q-event')?innerHeight-24:toolbar.getBoundingClientRect().top-12;
    if(!document.body.classList.contains('q-event')&&!qPictures.hidden&&qPictures.children.length)bottom=Math.min(bottom,qPictures.getBoundingClientRect().top-12);
    if(!layerGroup.hidden)bottom=Math.min(bottom,layerGroup.getBoundingClientRect().top-12);
    const box=heroBox(),target=box.getCenter(V3()),cam=camera.clone();cam.clearViewOffset();cam.fov=S.vertical?38:34;cam.updateProjectionMatrix();
    let best=null;
    for(const az of [15,20,25])for(const el of [15,20,25]){
      const a=az*Math.PI/180,e=el*Math.PI/180,dir=V3(Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e));
      for(let distance=2;distance<=20;distance+=.06){
        cam.position.copy(target).addScaledVector(dir,distance);cam.lookAt(target);cam.updateMatrixWorld();
        const b=projectedBox(box,cam),w=(b.right-b.left)/innerWidth,h=b.bottom-b.top;
        if(w>.75||h>bottom-top||b.left<8||b.right>innerWidth-8||b.behind)continue;
        const score=Math.abs(w-(S.vertical?.65:.69));
        if(!best||score<best.score)best={score,pos:cam.position.clone(),target:target.clone(),fov:cam.fov,offset:(top+bottom-b.top-b.bottom)/2};
        break;
      }
    }
    if(!best)return;
    controls.maxDistance=Math.max(14,best.pos.distanceTo(best.target));
    this.offset=best.offset;
    if(animate){flyTo(best,1.8);this.offsetAfter=true;}
    else {S.fly=null;camera.clearViewOffset();camera.position.copy(best.pos);camera.fov=best.fov;controls.target.copy(best.target);camera.lookAt(best.target);camera.updateProjectionMatrix();camera.setViewOffset(innerWidth,innerHeight,0,-best.offset,innerWidth,innerHeight);}
  },
  update(dt){
    this.clock+=dt;this.eventLeft=Math.max(0,this.eventLeft-dt);
    document.body.classList.toggle('q-event',this.eventLeft>0);
    const d=QUESTS[Q.i],f=Q.flags;
    const layoutKey=`${innerWidth}:${innerHeight}:${Q.free}:${Q.phase}:${layerGroup.hidden}:${this.eventLeft>0}`;
    if(T.mode!=='teacher'&&!A.active&&(this.refit||layoutKey!==this.layoutKey)&&!(Q.phase==='intro'&&!Q.free&&!f.pushed)){
      this.fit(Q.phase==='intro'&&!Q.free);this.refit=false;this.layoutKey=layoutKey;
    }
    if(this.offsetAfter&&!S.fly){camera.setViewOffset(innerWidth,innerHeight,0,-this.offset,innerWidth,innerHeight);this.offsetAfter=false;}
    if(S.drag&&S.sound.target){
      if(!this.tone){audioContext||=new(window.AudioContext||window.webkitAudioContext)();void audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();g.gain.value=.012;o.connect(g).connect(audioContext.destination);o.start();this.tone={o,g};}
      this.tone.o.frequency.setTargetAtTime(140+PHYS.grammarState(Math.round(S.body.value),Math.round(S.nWeights.value)).spring.shownMarks*18,audioContext.currentTime,.05);
    }else if(this.tone){this.tone.o.stop();this.tone=null;}
    if(Math.floor(this.clock*12)!==this.previewAt){this.previewAt=Math.floor(this.clock*12);qPictures.querySelectorAll('[data-candidate]').forEach(b=>b.innerHTML=CARDS.picture(d.id,d.candidates[+b.dataset.candidate],this.clock));}
    const project=p=>{const v=p.clone().project(camera);return [(v.x+1)*innerWidth/2,(1-v.y)*innerHeight/2];};
    const path=(p,dash=false)=>`<path d="${p}"${dash?' stroke-dasharray="5 5"':''}/>`;
    const focus=(Q.i===1?BALANCE_ARM:Q.i===4?JUMP_BALL:HANGING).getWorldPosition(V3());
    const needsInspect=(Q.i===1&&[0,1].includes(S.body.target)&&!f.visited.includes(S.body.target))||(Q.i===3&&PHYS.springState(S.body.target,S.nWeights.target).broken&&!f.breakSeen);
    const control=needsInspect?BALANCE_ARM:Q.i===4&&f.runs.every(r=>r.i!==S.body.target)?RUN_BUTTON:DIAL.knob;
    let body='';
    if(!Q.free&&Q.phase==='intro'&&f.elapsed<.9){
      body=`<g transform="translate(${innerWidth/2-42} ${innerHeight/2-42}) scale(3.5)"><defs><clipPath id="q-wipe"><rect width="${Math.min(24,f.elapsed/.65*24)}" height="24"/></clipPath></defs><g clip-path="url(#q-wipe)">${icon(d.icon).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g></g>`;
    }
    if(!Q.free&&Q.phase==='act'){
      for(const i of d.goalMarks){const [x,y]=project(SPECIMENS[i].group.getWorldPosition(V3()));body+=`<circle cx="${x}" cy="${y}" r="13" stroke-dasharray="3 3"/>`;}
      if(Q.i===6){
        const n=Math.round(S.nWeights.value),y0=PHYS.VIEW.springTop-PHYS.VIEW.springRest;
        const a=SPRING_RIG.localToWorld(V3(-.115,y0-PHYS.springState(0,n).marks*PHYS.C.similarMin*PHYS.VIEW.markUnit,.23));
        const b=SPRING_RIG.localToWorld(V3(-.115,y0-PHYS.springState(0,n).marks*PHYS.C.similarMax*PHYS.VIEW.markUnit,.23));
        const [x,y]=project(a),[xx,yy]=project(b);body+=path(`M${x-18} ${y}h36L${xx+18} ${yy}h-36z`,true);
      }
      if(f.demoLeft>0&&!S.drag){
        const [x,y]=project(control.getWorldPosition(V3())),shift=Math.min(1,(2.2-f.demoLeft)/1.7)*(control===RUN_BUTTON?22:55);
        body+=path(`M${x} ${y}l${control===RUN_BUTTON?0:55} ${control===RUN_BUTTON?22:0}`,true)+`<rect x="${x+(control===RUN_BUTTON?0:shift)-12}" y="${y+(control===RUN_BUTTON?shift:0)-12}" width="24" height="24" rx="10" opacity=".65"/>`;
      }
      if(needsInspect){const r=document.getElementById('tool-inspect').getBoundingClientRect();body+=`<rect x="${r.x+2}" y="${r.y+2}" width="${r.width-4}" height="${r.height-4}" rx="12" stroke-dasharray="4 4"/>`;}
    }
    if(this.eventLeft>0&&!Q.free){
      const [x,y]=project(focus),age=1.4-this.eventLeft,endX=Math.min(innerWidth-112,Math.max(112,x+75)),endY=Math.max(document.getElementById('mission').getBoundingClientRect().bottom+106,y-65),u=Math.min(1,age/.45);
      const mini=Q.i===3||Q.i===5?CARDS.micro(this.snapshot):d.card(this.snapshot);
      body=`<circle cx="${x}" cy="${y}" r="4" fill="#37795d"/>`+path(`M${x} ${y}L${x+(endX-x)*u} ${y+(endY-y)*u}`)+(age>.45?`<svg x="${endX-100}" y="${endY-94}" width="200" height="94" viewBox="0 0 300 140"><rect x="0.75" y="0.75" width="298.5" height="138.5" rx="12" fill="#f4efe3" stroke="#221d18" stroke-width="2.25"/>${mini.replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg>`:'');
    }
    qOverlay.innerHTML=body?`<svg viewBox="0 0 ${innerWidth} ${innerHeight}">${body}</svg>`:'';
  }
};
