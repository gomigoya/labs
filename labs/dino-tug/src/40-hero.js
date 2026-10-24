S.rivalN=0; // One scene-mode state; set() validates subsequent writes.
// One measured value, three identical dials. The grammar layer owns their lifetime.
S.lens=null;
function drawTensionMeters(group,value) {
 const radius=PHYS.DRAMA.kidHeight*.36,y=PHYS.DRAMA.ropeY+.88;
 const angle=Math.PI*(.85-1.7*PHYS.forceGlyph(value).length/PHYS.VIS.width);
 const ink=new THREE.MeshBasicMaterial({color:INK_CFG.diagram.ink,transparent:true,depthWrite:false});
 const paper=new THREE.MeshBasicMaterial({color:INK_CFG.diagram.screen,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 // Group z=.72; place the ends beside the front row hands and the centre on the rope.
 const ends=-(PHYS.dramaChild(5,4).x+.27*PHYS.DRAMA.kidHeight)+radius*2;
 for(const x of [-ends,0,S.rivalN>0?ends:PHYS.DRAMA.dinoX]){
  const dial=new THREE.Group();group.add(dial);dial.position.set(x,y,-.64);
  KIT.rod(V3(0,-.88,0),V3(0,-radius,0),.012,ink,dial);
  KIT.mesh(new THREE.CircleGeometry(radius,32),paper,dial,0,0,.015);
  KIT.mesh(new THREE.TorusGeometry(radius,.014,6,32),ink,dial,0,0,.02);
  for(let i=0;i<=6;i++){
   const a=Math.PI*(.85-1.7*i/6);
   KIT.rod(V3(Math.cos(a)*radius*.75,Math.sin(a)*radius*.75,.03),V3(Math.cos(a)*radius*.92,Math.sin(a)*radius*.92,.03),.008,ink,dial);
  }
  KIT.rod(V3(0,0,.045),V3(Math.cos(angle)*radius*.70,Math.sin(angle)*radius*.70,.045),.017,ink,dial);
  KIT.ball(.024,ink,dial,0,0,.045,1);
 }
}
const SPECIES_KEYS=Object.keys(PHYS.SPECIES), GROUND_VALUES=Object.values(PHYS.GROUNDS);
const TRACK=new THREE.Group();HERO.add(TRACK);
const groundColors=[THEME.glass,THEME.sand,THEME.gravel,THEME.asphalt];
const CASSETTES=GROUND_VALUES.map((mu,i)=>{
 const g=new THREE.Group();TRACK.add(g);

 const surface=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uMu:{value:mu},uKind:{value:i},uColor:{value:new THREE.Color(groundColors[i])}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform float uTime,uMu,uKind;uniform vec3 uColor;varying vec2 vUv;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){vec2 p=vUv*vec2(140.,26.);float n=hash(floor(p));float pattern;
 if(uKind<.5){pattern=.76+.24*pow(max(0.,sin(vUv.x*32.+vUv.y*17.+uTime*.5)),24.);}
 else if(uKind<1.5){pattern=.65+.25*sin(p.y+sin(p.x*.2)*2.)+.1*n;}
 else if(uKind<2.5){pattern=.42+.58*step(.35,n)*smoothstep(.1,.4,length(fract(p*.45)-.5));}
 else{pattern=.38+.45*n+.17*hash(floor(p*3.));}
 gl_FragColor=vec4(uColor*pattern*(1.+uMu*.1),1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,side:THREE.DoubleSide});
 const surf=KIT.mesh(new THREE.PlaneGeometry(PHYS.DRAMA.width-.14,PHYS.DRAMA.depth-.14).rotateX(-Math.PI/2),surface,g,0,PHYS.SCENE.top+.126,0);surf.castShadow=false;g.userData.surface=surface;
 const contact=KIT.mesh(new THREE.PlaneGeometry(PHYS.DRAMA.width-.14,PHYS.DRAMA.depth-.14).rotateX(-Math.PI/2),new THREE.ShadowMaterial({color:INK_CFG.shadow,opacity:INK_CFG.shadowOpacity}),g,0,PHYS.SCENE.top+.127,0);contact.castShadow=false;
 // Fixed seeded grains; surface is a schematic material sample, not a microphysical model.
 if(i){const grains=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(i===2?.028:.012,0),MAT[i===2?'bone':'rubber'],PHYS.VIS.grains),dummy=new THREE.Object3D();
  for(let j=0;j<PHYS.VIS.grains;j++){dummy.position.set((rand()-.5)*(PHYS.DRAMA.width-.3),PHYS.SCENE.top+.13,(rand()-.5)*(PHYS.DRAMA.depth-.3));dummy.scale.set(1,i===2?.5:.25,1);dummy.updateMatrix();grains.setMatrixAt(j,dummy.matrix);}grains.castShadow=true;grains.receiveShadow=true;g.add(grains);g.userData.grains=grains;}
 return g;
});
// One source of seeded crowd variation; no random calls in the frame loop.
const KID_STYLE={seed:731104,heightVariation:.08,phase:Math.PI*2,
 shirts:[INK_CFG.diagram.kids,THEME.warm,THEME.cool,INK_CFG.diagram.muscle,INK_CFG.diagram.friction,THEME.bone],
 pants:[THEME.navy,THEME.graphite,THEME.wood],hair:[THEME.rubber,THEME.wood,THEME.brass],
 skin:[THEME.bone,0xd6a577,0xa96f4e],shoes:[THEME.rubber,THEME.navy]};
const kidSeed=mulberry32(KID_STYLE.seed);
const KID_VARIANTS=Array.from({length:PHYS.C.kidsMax},()=>({height:1+(kidSeed()*2-1)*KID_STYLE.heightVariation,phase:kidSeed()*KID_STYLE.phase,
 shirt:Math.floor(kidSeed()*KID_STYLE.shirts.length),pants:Math.floor(kidSeed()*KID_STYLE.pants.length),hair:Math.floor(kidSeed()*KID_STYLE.hair.length),skin:Math.floor(kidSeed()*KID_STYLE.skin.length),shoes:Math.floor(kidSeed()*KID_STYLE.shoes.length)}));
const kidShadowMat=new THREE.MeshBasicMaterial({color:INK_CFG.shadow,transparent:true,opacity:INK_CFG.shadowOpacity,depthWrite:false});
// Units below are fractions of DRAMA.kidHeight. Open triangular limb tubes are
// buried inside clothes/hands/shoes; only their visible six-triangle sides remain.
const kidGeo={head:[],hair:[],shirt:[],pants:[],arms:[],legs:[],shoes:[],band:[],shadow:[]};
const kidScale=PHYS.DRAMA.kidHeight;
for(const [name,g] of [
 ['head',new THREE.SphereGeometry(.116,4,2).translate(-.06,.87,0)],
 ['hair',new THREE.SphereGeometry(.12,4,2,0,Math.PI*2,0,Math.PI/2).setIndex([0,10,11,1,11,12,2,12,13,3,13,14]).translate(-.06,.88,0)],
 ['shirt',new THREE.CylinderGeometry(.10,.12,.31,4,1,true).translate(-.025,.60,0)],
 ['pants',new THREE.CylinderGeometry(.115,.115,.14,4,1,true).translate(0,.39,0)],
 ['band',new THREE.CylinderGeometry(.103,.103,.035,3,1,true).translate(-.025,.68,0)],
 ['shadow',new THREE.CircleGeometry(.22,4).rotateX(-Math.PI/2).translate(0,.006,0)]])kidGeo[name].push(g);
for(const side of [-1,1]){
 const z=side*.10;
 for(const [name,a,b,r] of [
  ['arms',V3(-.035,.71,z),V3(.12,.55,z),.039],['arms',V3(.12,.55,z),V3(.27,.59,side*.025),.034],
  ['legs',V3(0,.38,z),V3(side<0?-.17:.12,.07,z),.047]]){
  const delta=b.clone().sub(a),g=new THREE.CylinderGeometry(r,r,delta.length(),3,1,true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0,1,0),delta.normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());kidGeo[name].push(g);
 }
 kidGeo.shoes.push(new THREE.TetrahedronGeometry(1).scale(.12,.042,.085).translate(side<0?-.12:.17,.042/Math.sqrt(3),z));
}
const kidGeometry={};
for(const [name,parts]of Object.entries(kidGeo)){
 const geometry=KIT.merge(parts);parts.forEach(g=>g.dispose());geometry.scale(kidScale,kidScale,kidScale);kidGeometry[name]=geometry;
}
function createKidTeam(max,prefix){
 const parts=[],named={};
 for(const [name,geometry]of Object.entries(kidGeometry)){
  const mesh=new THREE.InstancedMesh(geometry,name==='shadow'?kidShadowMat:KIT.toon(0xffffff),max);
  mesh.userData.inkInner=false;mesh.name=prefix+name;mesh.castShadow=name!=='shadow';mesh.receiveShadow=name!=='shadow';mesh.frustumCulled=false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);HERO.add(mesh);parts.push(mesh);named[name]=mesh;
 }
 return {parts,named};
}
const {parts:kidParts,named:kidNamed}=createKidTeam(PHYS.C.kidsMax,'kid-');
const rivalTeam=createKidTeam(PHYS.C.rivalMax,'rival-');
const kidColor=new THREE.Color();
const kidDeform=kidParts.filter(m=>m!==kidNamed.shadow).map(mesh=>({mesh,rest:mesh.geometry.attributes.position.array.slice(),normals:mesh.geometry.attributes.normal.array.slice()}));
let characterQuality='';
const kidDummy=new THREE.Object3D();
for(const z of [.72,.80])KIT.rod(V3(PHYS.SCENE.railStart,PHYS.SCENE.railY,z),V3(PHYS.railWorldX(1),PHYS.SCENE.railY,z),.012,MAT.brass,HERO);
for(const d of PHYS.DETENTS)KIT.rod(V3(PHYS.railWorldX(d.x),PHYS.SCENE.railY,.80),V3(PHYS.railWorldX(d.x),PHYS.SCENE.railY,.86),.006,MAT.glow,HERO);
const RAIL_HANDLE=KIT.roundedPanel(.14,.14,.17,MAT.chrome,HERO,PHYS.railWorldX(PHYS.railX(1)),PHYS.SCENE.railY,.76,.035);
KIT.ball(.038,MAT.glow,RAIL_HANDLE,0,.09,0,1);
// Shape, palette and ornament choices stay in one species table; PHYS form units
// and the exhibition height/stretch mapping are deliberately unchanged.
const DINO_SHAPES=[
 {name:'velociraptor',biped:true,body:[1,1.02,.82],chest:.23,pelvis:.12,head:[.36,.15,.15],neckRadius:.09,tail:1.45,tailRadius:.10,stance:.13,spread:.21,thigh:.095,shin:.042,foot:[.27,.08,.14],arm:[.23,.026],feathers:9,sickle:true,paint:{back:0x365f59,side:0x62ad9f,belly:0xd4d5b8},pattern:'ridge'},
 {name:'dilophosaurus',biped:true,body:[1,1.08,.94],chest:.24,pelvis:.14,head:[.38,.17,.17],neckRadius:.11,tail:1.2,tailRadius:.15,stance:.14,spread:.22,thigh:.12,shin:.048,foot:[.29,.09,.16],arm:[.23,.026],crest:true,paint:{back:0x4a663e,side:0x85b86e,belly:0xd8d7b4},pattern:'crest'},
 {name:'stegosaurus',body:[1,1,1],legX:[-.32,.32],stance:.09,spread:.22,thigh:.075,shin:.075,foot:[.27,.12,.14],plates:7,spikes:4,paint:{back:0x436254,side:0x78af96,belly:0xd6d6b8},pattern:'plates'},
 {name:'triceratops',body:[1,1,1],legX:[-.32,.32],stance:.09,spread:.22,thigh:.075,shin:.075,foot:[.27,.12,.14],horns:true,paint:{back:0x366056,side:0x60ab9a,belly:0xd4d5b9},pattern:'frill'},
 {name:'tyrannosaurus',biped:true,body:[1,1.02,1.14],chest:.28,pelvis:.18,head:[.43,.25,.28],neckRadius:.15,tail:1.2,tailRadius:.22,stance:.18,spread:.25,thigh:.17,shin:.065,foot:[.36,.10,.20],arm:[.12,.028],paint:{back:0x3e6550,side:0x70b590,belly:0xd6d7b7},pattern:'stripes'},
 {name:'argentinosaurus',body:[1,1,1],legX:[-.32,.32],stance:0,spread:.19,thigh:.09,shin:.085,foot:[.27,.12,.14],longNeck:true,paint:{back:0x4a6759,side:0x84b89f,belly:0xd8d8b9},pattern:'spots'}
];
// Rest-space paint is independent of pose, lighting and face triangulation.
const DINO_BANDS={belly:1/3,back:2/3,heightWeight:.75};
function dinoBand(localHeight,normalY){
 return clamp(.5+DINO_BANDS.heightWeight*localHeight+(1-DINO_BANDS.heightWeight)*normalY*.5,0,1);
}
// KIT.merge intentionally has a fixed common attribute list. Preserve host paint here.
function mergeDinoPaint(parts){
 const geometry=KIT.merge(parts),values=[];
 for(const part of parts){
  const a=part.getAttribute('dinoPaint'),index=part.index;
  for(let j=0;j<(index?index.count:a.count);j++){
   const k=index?index.getX(j):j;for(let c=0;c<4;c++)values.push(a.array[k*4+c]);
  }
 }
 geometry.setAttribute('dinoPaint',new THREE.Float32BufferAttribute(values,4));return geometry;
}
function dinoPaintMaterial(shape){
 const material=KIT.toon(0xffffff,{vertexColors:true});
 let upstream=material.onBeforeCompile,upstreamKey=material.customProgramCacheKey;
 const compile=function(shader,renderer){
  upstream.call(this,shader,renderer);
  shader.uniforms.dinoBelly={value:new THREE.Color(shape.paint.belly)};
  shader.uniforms.dinoSide={value:new THREE.Color(shape.paint.side)};
  shader.uniforms.dinoBack={value:new THREE.Color(shape.paint.back)};
  shader.uniforms.dinoThresholds={value:new THREE.Vector2(DINO_BANDS.belly,DINO_BANDS.back)};
  shader.uniforms.dinoPattern={value:shape.pattern==='stripes'?1:shape.pattern==='spots'?2:0};
  shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
   attribute vec4 dinoPaint;
   varying vec4 vDinoPaint;`);
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vDinoPaint=dinoPaint;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec4 vDinoPaint;
   uniform vec3 dinoBelly,dinoSide,dinoBack;
   uniform vec2 dinoThresholds;
   uniform float dinoPattern;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float dinoWidth=max(fwidth(vDinoPaint.x),0.00001)*0.5;
   vec2 dinoSteps=smoothstep(dinoThresholds-vec2(dinoWidth),dinoThresholds+vec2(dinoWidth),vec2(vDinoPaint.x));
   vec3 dinoColor=mix(mix(dinoBelly,dinoSide,dinoSteps.x),dinoBack,dinoSteps.y);
   // Four broad torso stripes and four tail stripes, painted on the surface.
   float dinoMark=0.0;
   if(dinoPattern>0.5){
    float wave=sin(vDinoPaint.z*25.13274123+vDinoPaint.w*0.8);
    float cut=0.55;
    if(dinoPattern>1.5){wave=sin(vDinoPaint.z*18.84955592)*cos(vDinoPaint.w*12.56637061);cut=0.50;}
    float aa=max(fwidth(wave),0.00001)*0.5;
    dinoMark=smoothstep(cut-aa,cut+aa,wave)*step(0.0,vDinoPaint.z)*smoothstep(0.50,0.56,vDinoPaint.x);
   }
   dinoColor=mix(dinoColor,dinoBack,dinoMark);
   diffuseColor.rgb=mix(diffuseColor.rgb,dinoColor,vDinoPaint.y);`);
 };
 // 47 adopts Toon materials later and assigns both hooks. Capture its hooks, then
 // compose ours after them; repeated convertMaterials calls leave this intact.
 Object.defineProperty(material,'onBeforeCompile',{configurable:true,get:()=>compile,set:fn=>{upstream=fn;}});
 Object.defineProperty(material,'customProgramCacheKey',{configurable:true,
  get:()=>function(){return upstreamKey.call(this)+'-dino-paint-r14';},set:fn=>{upstreamKey=fn;}});
 return material;
}
const DINO_MODELS=SPECIES_KEYS.map((s,i)=>{
 const scale=PHYS.dramaState(59,s,GROUND_VALUES[2]).scale,f=PHYS.SCENE.forms[i],shape=DINO_SHAPES[i];
 const g=new THREE.Group();g.name=shape.name;g.position.set(PHYS.DRAMA.dinoX,PHYS.DRAMA.ground,PHYS.DRAMA.dinoZ);g.scale.set(scale*PHYS.DRAMA.dinoStretch,scale,scale);HERO.add(g);
 const [length,height,leg,neck,head,tail]=f,bodyY=leg+height/2;
 const neckPoints=shape.biped?[V3(-length*.30,bodyY+.01,0),V3(-length*.43,bodyY+neck*.36,0),V3(-length*.42,bodyY+neck*.82,0),V3(-length*.55,bodyY+neck,0)]:
  [V3(-length*.35,bodyY+.02,0),V3(-length*.48,bodyY+neck*.26,0),V3(-length*.47-.10,bodyY+neck*.77,0),V3(-length*.49-.16,bodyY+neck,0)];
 const neckTop=neckPoints.at(-1),hl=shape.biped?shape.head[0]*length:head*1.15,hh=shape.biped?shape.head[1]*length:.22,hw=shape.biped?shape.head[2]*length:.26;
 const hx=neckTop.x-hl*.34,hy=neckTop.y+.07,tailStart=length*.30,tailSpan=shape.biped?length*shape.tail:length*.15+tail;
 const base=new THREE.Color(shape.paint.side),dark=new THREE.Color(shape.paint.back),belly=new THREE.Color(shape.paint.belly),warm=new THREE.Color(THEME.warm);
 const limb=base.clone().multiplyScalar(.86),footColor=base.clone().multiplyScalar(.70);
 // A crouched free leg has exactly leg units of bone: thigh + shin + metatarsus.
 // Negative X is forward. The hock and sole remain planted during torso lean.
 function bendKnee(hip,hock,upper,lower){
  const dx=hock.x-hip.x,dy=hock.y-hip.y,d=Math.hypot(dx,dy),safe=clamp(d,Math.abs(upper-lower)+1e-6,upper+lower-1e-6);
  const along=(upper*upper-lower*lower+safe*safe)/(2*safe),out=Math.sqrt(Math.max(0,upper*upper-along*along));
  return V3(hip.x+dx/d*along+dy/d*out,hip.y+dy/d*along-dx/d*out,hip.z);
 }
 const legChains=[];
 if(shape.biped)for(const side of [-1,1]){
  const x=.15+side*shape.stance,z=side*shape.spread,ankle=V3(x+leg*.12,shape.foot[1]*.90,z),hock=ankle.clone().add(V3(0,leg*.16,0));
  const hip=V3(x,ankle.y+leg*.78,z),knee=bendKnee(hip,hock,leg*.46,leg*.38);
  legChains.push([hip,knee,hock,ankle]);
 }
 const variants=[false,true].map(low=>{
  const parts=[],details=[],shadows=[],radial=low?5:10,steps=low?6:16;
  let activeLeg=-1;
  // Motion: head/tail/root weights, or negative leg ID + bone coordinate.
  // Shared seam/pole values interpolate before fragment-stage quantization.
  function threeTone(geometry,region){
   const local=geometry.userData.palette,p=geometry.attributes.position,n=geometry.attributes.normal,paint=[];
   for(let j=0;j<p.count;j++){
    const h=Array.isArray(local)?local[j]:(p.getY(j)-local.y)/local.height;
    const band=dinoBand(h,n.getY(j));
    const mark=region==='torso'||region==='tail';
    const u=region==='tail'?(p.getX(j)-tailStart)/tailSpan:(p.getX(j)/length+.5);
    paint.push(band,1,mark?clamp(u,0,1):-10,p.getZ(j)/(.5*shape.body[2]));
   }
   geometry.setAttribute('dinoPaint',new THREE.Float32BufferAttribute(paint,4));return geometry;
  }
  function add(geometry,color=base,region='torso',detail=false){
   if(color===base)geometry=threeTone(geometry,region);
   const p=geometry.attributes.position,colors=[],motion=[];
   for(let j=0;j<p.count;j++){
    const x=p.getX(j),y=p.getY(j);colors.push(color.r,color.g,color.b);
    if(region==='leg'&&shape.biped){motion.push(-activeLeg-1,geometry.userData.bones[j],0);continue;}
    motion.push(region==='head'?1:region==='neck'?clamp((y-bodyY)/Math.max(neck,.01),0,1):0,region==='tail'?clamp((x-tailStart)/tailSpan,0,1):0,region==='leg'?clamp((y-.10)/(bodyY-.18),0,1):region==='fixed'?0:1);
   }
   if(color===base)colors.fill(1);
   geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
   if(!geometry.hasAttribute('dinoPaint')){
    const paint=[];for(let j=0;j<p.count;j++)paint.push(.5,0,-10,0);
    geometry.setAttribute('dinoPaint',new THREE.Float32BufferAttribute(paint,4));
   }
   geometry.setAttribute('motion',new THREE.Float32BufferAttribute(motion,3));(detail?details:parts).push(geometry);
  }
  function ell(x,y,z,a,b,c,color=base,region='torso',body=false){
   const pad=region==='fixed',pelvis=region==='pelvis';
   const geo=new THREE.SphereGeometry(1,pad?(low?6:10):pelvis?(low?6:12):(low?8:18),pad?(low?3:6):pelvis?(low?3:8):(low?5:12)),p=geo.attributes.position;
   geo.userData.palette={y,height:2*b};
   for(let j=0;j<p.count;j++){
    let xx=p.getX(j),yy=p.getY(j),zz=p.getZ(j);
    const front=Math.exp(-(((xx+.40)*3)**2)),rear=Math.exp(-(((xx-.48)*4)**2));
    const chest=body?1+(shape.chest??.13)*front+(shape.pelvis??-.10)*rear:1;
    const depth=body&&shape.biped&&yy<0?1+shape.chest*front+shape.pelvis*rear:1;
    p.setXYZ(j,x+xx*a,y+(body?Math.max(-.78,yy):yy)*b*depth,z+zz*c*chest);
   }KIT.smoothNormals(geo);add(geo,color,region);
  }
  function tube(points,radii,region='torso',color=base,detail=false){
   const curve=new THREE.CatmullRomCurve3(points),geo=new THREE.TubeGeometry(curve,steps,1,radial,false),p=geo.attributes.position;
   const bones=[],palette=[];
   for(let k=0;k<=steps;k++){
    const u=k/steps,center=curve.getPointAt(u),f=u*(radii.length-1),j=Math.min(radii.length-2,Math.floor(f)),v=f-j;
    const radius=THREE.MathUtils.lerp(radii[j],radii[j+1],v*v*(3-2*v));
    let bone=0;
    if(region==='leg'&&shape.biped){
     const chain=legChains[activeLeg];let closest=Infinity;
     for(let b=0;b<3;b++){
      const a=chain[b],delta=chain[b+1].clone().sub(a),v=center.clone().sub(a),len2=delta.lengthSq(),u=clamp(v.dot(delta)/len2,0,1);
      const distance=v.sub(delta.multiplyScalar(u)).lengthSq();if(distance<closest){closest=distance;bone=b+u;}
     }
    }
    for(let r=0;r<=radial;r++){bones.push(bone);const n=k*(radial+1)+r;palette.push((p.getY(n)-center.y)*.5);p.setXYZ(n,center.x+(p.getX(n)-center.x)*radius,center.y+(p.getY(n)-center.y)*radius,center.z+(p.getZ(n)-center.z)*radius);}
   }geo.userData.bones=bones;geo.userData.palette=palette;KIT.smoothNormals(geo);add(geo,color,region,detail);
  }
  function cone(a,b,r,color=belly,region='torso',detail=false){
   const delta=b.clone().sub(a),geo=new THREE.ConeGeometry(r,delta.length(),low?4:6);
   geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0,1,0),delta.normalize()));geo.translate(...a.clone().add(b).multiplyScalar(.5).toArray());add(geo,color,region,detail);
  }
  ell(0,bodyY,0,length*shape.body[0]/2,height*shape.body[1]/2,.25*shape.body[2],base,'torso',true);
  tube(neckPoints,[shape.neckRadius||.13,(shape.neckRadius||.13)*.94,shape.longNeck?.065:(shape.neckRadius||.13)*.80,shape.longNeck?.065:(shape.neckRadius||.13)*.85],'neck');
  const tailPoints=[V3(tailStart,bodyY,0),V3(tailStart+tailSpan*.34,bodyY-.015,0),V3(tailStart+tailSpan*.72,bodyY-.045-(shape.biped?0:.12),0),V3(tailStart+tailSpan,shape.biped?bodyY-.08:leg+.12,0)];
  tube(tailPoints,[shape.tailRadius||.14,(shape.tailRadius||.14)*.65,(shape.tailRadius||.14)*.28,.003],'tail');
  // Rounded upper skull and a lower jaw with a dark visible mouth opening.
  ell(hx,hy+hh*.16,0,hl*.58,hh*.46,hw*.54,base,'head');
  ell(hx-hl*.04,hy-hh*.25,0,hl*.53,hh*.08,hw*.49,dark,'head');
  ell(hx+hl*.015,hy-hh*.44,0,hl*.50,hh*.16,hw*.47,base,'head');
  for(const side of [-1,1]){
   ell(hx-hl*.02,hy+hh*.32,side*hw*.49,hh*.17,hh*.17,hh*.11,new THREE.Color(INK_CFG.diagram.reference),'head');
   ell(hx-hl*.065,hy+hh*.33,side*hw*.55,hh*.085,hh*.095,hh*.065,new THREE.Color(THEME.rubber),'head');
   ell(hx-hl*.43,hy+hh*.19,side*hw*.35,hh*.055,hh*.04,hh*.035,dark,'head');
   if(shape.biped&&!low)for(let t=0;t<4;t++)cone(V3(hx-hl*.36+t*hl*.17,hy-hh*.19,side*hw*.37),V3(hx-hl*.36+t*hl*.17,hy-hh*.36,side*hw*.37),hh*.045,belly,'head',true);
  }
  for(const x of shape.legX||[.15])for(const side of [-1,1]){
   const z=side*shape.spread,offset=side*shape.stance,footX=shape.biped?legChains[side<0?0:1][3].x-shape.foot[0]*.12:x-.03+offset;
   if(shape.biped){
    activeLeg=side<0?0:1;const chain=legChains[activeLeg],thigh=height*shape.body[1]*.25;
    // Embedded pelvic mass overlaps the torso and the thick thigh socket.
    ell(chain[0].x,leg+height*.12,z*.74,thigh*1.12,height*.33,thigh,limb,'pelvis');
    tube(chain,[thigh,thigh*.42,shape.shin,shape.shin*.78],'leg',limb);
    ell(footX,shape.foot[1]*.48,z,shape.foot[0]*.30,shape.foot[1]*.48,shape.foot[2]*.53,footColor,'fixed');
    for(const toe of [-1,0,1]){
     ell(footX-shape.foot[0]*.30,shape.foot[1]*.32,z+toe*shape.foot[2]*.39,shape.foot[0]*.39,shape.foot[1]*.29,shape.foot[2]*.19,footColor,'fixed');
    }
   }else{
    const hip=V3(x+offset,bodyY-.08,z),knee=V3(hip.x,leg*.53,z),ankle=V3(x+.06+offset,shape.foot[1],z);
    tube([hip,knee,ankle],[shape.thigh*1.22,shape.thigh,shape.shin*.82],'leg',limb);
    ell(footX,shape.foot[1]*.40,z,shape.foot[0]*.60,shape.foot[1]*.40,shape.foot[2]*.70,footColor,'fixed');
   }
   if(!low)for(const toe of [-1,0,1])cone(V3(footX-shape.foot[0]*.53,shape.foot[1]*.37,z+toe*shape.foot[2]*.39),V3(footX-shape.foot[0]*.73,shape.foot[1]*.20,z+toe*shape.foot[2]*.42),shape.foot[1]*.15,belly,'fixed',true);
   if(shape.sickle&&!low)tube([V3(footX-.04,.06,z+.06),V3(footX-.10,.16,z+.06),V3(footX-.18,.06,z+.06)],[.022,.018,.001],'fixed',belly,true);
   const shadow=new THREE.CircleGeometry(.20,12).rotateX(-Math.PI/2).scale(1,1,.55).translate(footX,.002,z);shadows.push(shadow);
  }
  if(shape.arm)for(const side of [-1,1]){
   const z=side*.22,a=V3(-.25,bodyY+.05,z),b=V3(-.34,bodyY-shape.arm[0]*.65,z),c=V3(-.43,bodyY-shape.arm[0],z);
   tube([a,b,c],[shape.arm[1],shape.arm[1]*.8,shape.arm[1]*.6],'torso',limb);
   if(!low)for(const toe of [-1,1])cone(c.clone().add(V3(0,0,toe*.013)),c.clone().add(V3(-.04,-.025,toe*.021)),.009,belly,'torso',true);
  }
  if(shape.crest)for(const side of [-1,1])ell(hx+.025,hy+hh*.78,side*.065,hl*.40,.12,.023,warm,'head');
  if(shape.feathers)for(let j=0;j<shape.feathers;j++)cone(V3(-length*.24+j*.085,bodyY+height*.33,0),V3(-length*.18+j*.085,bodyY+height*.33+.09*(1-j/14),0),.035,dark);
  if(shape.plates)for(const side of [-1,1])for(let j=0;j<shape.plates;j++){
   const x=-.43+j*.16,y=bodyY+height*.40*Math.sqrt(Math.max(.1,1-(x/(length*.65))**2));
   ell(x,y+.11,side*.065,.085,.17*(.7+.3*Math.sin(j/6*Math.PI)),.026,warm);
  }
  if(shape.spikes)for(let j=0;j<shape.spikes;j++){
   const u=.66+Math.floor(j/2)*.19,side=j%2?1:-1;
   cone(V3(tailStart+tailSpan*u,leg+.19,side*.02),V3(tailStart+tailSpan*(u+.06),leg+.33,side*.22),.037,belly,'tail');
  }
  if(shape.horns){
   // Nested shells expose only the pale outer frill band; both follow head pitch.
   ell(neckTop.x+.07,hy+.10,0,.075,.32,.33,belly,'head');
   ell(neckTop.x+.035,hy+.10,0,.075,.275,.285,base,'head');
   for(const z of [-.12,.12])cone(V3(hx+.02,hy+.12,z),V3(hx-.21,hy+.41,z),.045,belly,'head');
   cone(V3(hx-hl*.35,hy+.08,0),V3(hx-hl*.53,hy+.23,0),.033,belly,'head');
  }
  const mesh=KIT.mesh(mergeDinoPaint(parts),dinoPaintMaterial(shape),g);mesh.name='body';mesh.frustumCulled=false;
  const detailMesh=details.length?KIT.mesh(mergeDinoPaint(details),mesh.material,g):null;if(detailMesh){detailMesh.name='teeth-claws';detailMesh.frustumCulled=false;}
  const contact=KIT.mesh(KIT.merge(shadows),kidShadowMat,g);contact.name='foot-contact-shadows';contact.castShadow=false;contact.receiveShadow=false;
  for(const m of [mesh,detailMesh,contact])if(m)m.userData.characterLod=low?'low':'high';
  [...parts,...details,...shadows].forEach(geo=>geo.dispose());
  const deform=[mesh,detailMesh].filter(Boolean).map(m=>({mesh:m,rest:m.geometry.attributes.position.array.slice(),normals:m.geometry.attributes.normal.array.slice()}));
  return {mesh,detailMesh,contact,deform};
 });
 // One animation path for the visible body and details.
 function animateDino(t,load){
 const low=S.quality==='low',v=variants[low?1:0];
  for(const [j,lod]of variants.entries())for(const m of [lod.mesh,lod.detailMesh,lod.contact])if(m)m.visible=j===(low?1:0);
  const breath=1+Math.sin(t*(2.4+load*3.2))*.015,pitch=Math.sin(t*(1.8+load))*.025-load*.085;
  const lean=-load*.24,cs=Math.cos(lean),sn=Math.sin(lean),pc=Math.cos(pitch),ps=Math.sin(pitch);
  const posedLegs=legChains.map(chain=>{
   const hip=chain[0],yy=(hip.y-bodyY)*breath,moved=V3(hip.x*cs-yy*sn,bodyY+hip.x*sn+yy*cs,hip.z);
   return [moved,bendKnee(moved,chain[2],leg*.46,leg*.38),chain[2],chain[3]];
  });
  const legBones=legChains.map((chain,i)=>chain.slice(0,3).map((a,b)=>{
   const restDelta=chain[b+1].clone().sub(a),posed=posedLegs[i],delta=posed[b+1].clone().sub(posed[b]);
   const angle=Math.atan2(delta.y,delta.x)-Math.atan2(restDelta.y,restDelta.x);
   return {a,b:chain[b+1],p:posed[b],q:posed[b+1],cs:Math.cos(angle),sn:Math.sin(angle)};
  }));
  for(const {mesh,rest,normals}of v.deform){
   const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,w=mesh.geometry.attributes.motion;
   for(let j=0;j<p.count;j++){
    const k=j*3,hw=w.getX(j),tw=w.getY(j),root=w.getZ(j);let x=rest[k],y=rest[k+1],z=rest[k+2],nx=normals[k],ny=normals[k+1],nz=normals[k+2];
    if(hw<0){
     const bone=legBones[-hw-1][Math.min(2,Math.floor(tw))],u=tw-Math.min(2,Math.floor(tw));
     const rx=bone.a.x+(bone.b.x-bone.a.x)*u,ry=bone.a.y+(bone.b.y-bone.a.y)*u;
     const dx=x-rx,dy=y-ry;
     p.setXYZ(j,bone.p.x+(bone.q.x-bone.p.x)*u+dx*bone.cs-dy*bone.sn,bone.p.y+(bone.q.y-bone.p.y)*u+dx*bone.sn+dy*bone.cs,z);
     n.setXYZ(j,nx*bone.cs-ny*bone.sn,nx*bone.sn+ny*bone.cs,nz);continue;
    }
    if(hw){const xx=x-neckTop.x,yy=y-neckTop.y;x+=(xx*pc-yy*ps-xx)*hw;y+=(xx*ps+yy*pc-yy)*hw;const nn=nx;nx+=(nn*pc-ny*ps-nn)*hw;ny+=(nn*ps+ny*pc-ny)*hw;}
    z+=Math.sin(t*1.7)*.075*tw*tw;nx-=Math.sin(t*1.7)*.15*tw/tailSpan*nz;
    const yy=(y-bodyY)*breath,xx=x;y+=(bodyY+xx*sn+yy*cs-y)*root;x+=(xx*cs-yy*sn-x)*root;
    // Front limbs press down as load rises; ankle/foot vertices have root=0.
    y-=load*.025*root*(1-root);if(root>0&&shape.arm&&rest[k]<-.24&&rest[k]>-.48&&rest[k+1]<bodyY&&Math.abs(rest[k+2])>.19){y-=load*.025;x-=load*.015;}p.setXYZ(j,x,y,z);
    const ax=nx,ay=ny/breath;nx+=(ax*cs-ay*sn-nx)*root;ny+=(ax*sn+ay*cs-ny)*root;
    const inv=1/Math.hypot(nx,ny,nz);n.setXYZ(j,nx*inv,ny*inv,nz*inv);
   }p.needsUpdate=true;n.needsUpdate=true;
  }
 }
 g.pose=lean=>animateDino(S.t.value,clamp(-lean/.24,0,1));
 g.pose(0);return g;
});
// Two endpoint specimens sit above the ratio graph; they share the existing anatomy geometry.
for(const [j,i] of [0,5].entries()){
 const g=DINO_MODELS[i].clone(true);g.position.set(...CONTROL_LAYOUT.specimens[j]);g.scale.multiplyScalar(PHYS.SCENE.comparisonScale);CONSOLE.add(g);
}
KIT.expansion(CONSOLE,...CONTROL_LAYOUT.expansion);
// Kid-height comparison post; conversion is PHYS.C.kidHeight times the display scale.
const STAKE=new THREE.Group();HERO.add(STAKE);
const stakeHeight=PHYS.DRAMA.kidHeight;
KIT.rod(V3(2.77,PHYS.SCENE.top+.14,-.40),V3(2.77,PHYS.SCENE.top+.14+stakeHeight,-.40),.025,MAT.bone,STAKE);
for(let j=0;j<=4;j++)KIT.rod(V3(2.71,PHYS.SCENE.top+.14+stakeHeight*j/4,-.40),V3(2.83,PHYS.SCENE.top+.14+stakeHeight*j/4,-.40),.008,MAT.brass,STAKE);
const SIZE_MARK=KIT.expansion(HERO,PHYS.DRAMA.dinoX,3.4,.2);SIZE_MARK.scale.setScalar(.18);
// Horizontal harness: paired uncalibrated knots show tautness, never measured tension.
const ROPE=new THREE.Group();ROPE.position.set(0,PHYS.DRAMA.ropeY,.08);HERO.add(ROPE);
KIT.rod(V3(-4.5,0,0),V3(PHYS.DRAMA.dinoX,0,0),.05,MAT.bone,ROPE);
const TEAM_ROPES=[0,1,2].map(row=>KIT.rod(V3(PHYS.DRAMA.kidStart,0,-.86+row*PHYS.DRAMA.rowGap),V3(-.25,0,-.86+row*PHYS.DRAMA.rowGap),.025,MAT.bone,ROPE));
const TEAM_JOINS=[0,1,2].map(row=>KIT.rod(V3(-.25,0,-.86+row*PHYS.DRAMA.rowGap),V3(.12,0,0),.025,MAT.bone,ROPE));
const RIVAL_ROPES=new THREE.Group();RIVAL_ROPES.scale.x=-1;ROPE.add(RIVAL_ROPES);
const rivalRopes=TEAM_ROPES.map(r=>{const copy=r.clone();RIVAL_ROPES.add(copy);return copy;});
const rivalJoins=TEAM_JOINS.map(r=>{const copy=r.clone();RIVAL_ROPES.add(copy);return copy;});
const RIVAL_EXTENSION=KIT.rod(V3(PHYS.DRAMA.dinoX,0,0),V3(4.5,0,0),.05,MAT.bone,ROPE);
const harness=KIT.mesh(new THREE.TorusGeometry(.17,.028,6,16),MAT.brass,HERO,PHYS.DRAMA.dinoX,PHYS.DRAMA.ropeY,PHYS.DRAMA.dinoZ);harness.rotation.y=Math.PI/2;
const FLAG=new THREE.Group();FLAG.scale.setScalar(2.55);ROPE.add(FLAG);
KIT.rod(V3(0,-.13,0),V3(0,.27,0),.018,MAT.brass,FLAG);
const FLAG_PANEL=KIT.roundedPanel(.24,.22,.032,MAT.glow.clone(),FLAG,.12,.24,0,.008);
const FORCE_KNOTS=Array.from({length:8},(_,i)=>{const x=(i<4?-1:1)*(.32+(i%4)*.20),k=KIT.ball(PHYS.DRAMA.beadRadius,MAT.brass,ROPE,x,0,0,1);k.userData.x=x;return k;});
for(let i=-4;i<=4;i++)KIT.rod(V3(i*PHYS.DRAMA.flagStep,PHYS.DRAMA.ground,i?-.15:-.275),V3(i*PHYS.DRAMA.flagStep,PHYS.DRAMA.ground,i?.35:.475),i?.018:.027,i?MAT.bone:MAT.glow,HERO);
const SLIP_DUST=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.035,0),new THREE.MeshStandardMaterial({color:THEME.sand,transparent:true,opacity:.8}),PHYS.VIS.dustCount);SLIP_DUST.frustumCulled=false;HERO.add(SLIP_DUST);
// R1 basic capacity fills; richer thresholds, beads and contact lens arrive in R2.
const CAPACITIES=new THREE.Group();CAPACITIES.position.copy(CONSOLE.position);CAPACITIES.rotation.copy(CONSOLE.rotation);HERO.add(CAPACITIES);
const BARS=[INK_CFG.diagram.kids,INK_CFG.diagram.dino].map((color,i)=>{
 const g=new THREE.Group();g.position.set(...CONTROL_LAYOUT.bars[i]);g.scale.setScalar(CONTROL_LAYOUT.barScale);CAPACITIES.add(g);
 KIT.roundedPanel(PHYS.SCENE.barWidth,.13,.06,MAT.graphite,g,PHYS.SCENE.barWidth/2,0,0,.025);
 const material=new THREE.ShaderMaterial({uniforms:{uColor:{value:new THREE.Color(color)},uTime:{value:0},uUnit:{value:1},uStyle:{value:0},uForce:{value:0},uOpacity:{value:1}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
 fragmentShader:`uniform vec3 uColor;uniform float uTime,uUnit,uStyle,uForce,uOpacity;varying vec2 vUv;
 void main(){float edge=1.-smoothstep(.15,.5,abs(vUv.y-.5));
 float cell=step(.12,fract(vUv.x/max(.001,uUnit)));
 float dash=uStyle<.5?1.:step(.35,fract(vUv.x*(uStyle<1.5?40.:19.)));
 float flow=pow(max(0.,sin(vUv.x*75.-uTime*(1.+uForce)*4.)),18.);
 gl_FragColor=vec4(uColor*(1.3+edge+flow*.65),(.55+.25*cell)*dash*uOpacity);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 // Shader chunks must start on their own lines.
 material.fragmentShader=material.fragmentShader.replace(';#include',';\n#include');
 const fill=KIT.mesh(new THREE.PlaneGeometry(1,.072).translate(.5,0,0),material,g,0,0,.035);fill.castShadow=false;
 const sign=KIT.expansion(g,PHYS.SCENE.barWidth+.055,0,.04);
 const cut=KIT.line([V3(-.025,-.06,.041),V3(.005,-.02,.041),V3(-.025,.02,.041),V3(.005,.06,.041)],color,g);cut.position.x=PHYS.SCENE.barWidth-.10;
 return {fill,sign,cut};
});
Object.assign(S,{pullP:0,pullMode:false});
let previousPullForce=0,pullBurstAt=-10,previousPullSession=null;
function updateHero(){
 CAPACITIES.position.copy(CONSOLE.position);CAPACITIES.rotation.copy(CONSOLE.rotation);
 const n=PHYS.kidsFromRailX(S.u.value),i=Math.round(S.species.value),gi=Math.round(S.ground.value);
 const d=PHYS.dramaState(n,SPECIES_KEYS[i],GROUND_VALUES[gi],S.t.value,S.rivalN);
 if(previousPullSession!==Q.flags){previousPullSession=Q.flags;previousPullForce=0;pullBurstAt=-10;}
 if(S.pullMode){
  const f=PHYS.staticPull(n,GROUND_VALUES[gi],S.pullP);
  const travel=f.slipped?PHYS.DRAMA.flagTravel*(S.pullP-f.pSlip)/(1-f.pSlip):0;
  Object.assign(d,{flagX:travel,kidSkid:travel,dinoSkid:0,slip:f.slipped,winner:f.slipped?'dino':'tie',lean:-.12*S.pullP,beadAmplitude:0,effort:S.pullP,slipX:PHYS.dramaChild(n,Math.min(n-1,3)).x+travel});
  if(PHYS.slipOnset(previousPullForce,f.applied,n*PHYS.C.kidMass,GROUND_VALUES[gi]))pullBurstAt=DIRECTOR.clock;
  previousPullForce=f.applied;
 }else previousPullForce=0;
 const low=S.quality==='low',load=clamp(-d.lean/.24,0,1),time=S.t.value;
 // Includes the existing specimen clones; new grammar clones inherit current LOD.
 if(characterQuality!==S.quality){
  characterQuality=S.quality;scene.traverse(o=>{if(o.userData.characterLod)o.visible=o.userData.characterLod===(low?'low':'high');});
 }
 const drag=clamp((Math.abs(d.kidSkid)+Math.abs(d.dinoSkid))*4,0,1),angle=.03+load*.24+drag*.08;
 // Deform the shared anatomy and merged outline together. Toe vertices stay on
 // the ground; upper arms follow the chest, while hands keep reaching the rope.
 for(const {mesh,rest,normals}of kidDeform){
  const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;
  for(let j=0;j<p.count;j++){
   const k=j*3,x=rest[k],y=rest[k+1],z=rest[k+2],root=clamp((y/kidScale-.12)/.60,0,1);
   const arm=mesh===kidNamed.arms;
   const grip=arm?clamp((.27-x/kidScale)/.30,0,1):1;
   const shift=angle*y*root*grip,foot=1-clamp(y/(kidScale*.28),0,1);
   p.setXYZ(j,x-shift+drag*.025*foot*(z<0?1:-1),y,z);
   const nx=normals[k],ny=normals[k+1]+angle*root*grip*nx,nz=normals[k+2],inv=1/Math.hypot(nx,ny,nz);n.setXYZ(j,nx*inv,ny*inv,nz*inv);
  }p.needsUpdate=true;n.needsUpdate=true;
 }
 for(const [rival,team,total,skid]of [[false,{parts:kidParts,named:kidNamed},n,d.kidSkid],[true,rivalTeam,Math.min(S.rivalN,PHYS.C.rivalMax),d.dinoSkid]]){
 for(const mesh of team.parts)mesh.count=total;team.named.hair.visible=!low;
 for(let k=0;k<total;k++){
  const p=PHYS.dramaChild(total,k),v=KID_VARIANTS[k],breath=Math.sin(time*(2.4+load*2)+v.phase)*.006;
  // The team's own skid is authoritative; the dinosaur skid also cues a short drag stance.
  kidDummy.position.set((rival?-p.x:p.x)+skid,p.y,p.z);
  kidDummy.rotation.set(0,rival?Math.PI:0,0);
  kidDummy.scale.set(v.height,v.height*(1+breath),v.height);kidDummy.updateMatrix();
  for(const [name,mesh]of Object.entries(team.named)){
   if(name==='shadow'){
    kidDummy.rotation.z=0;kidDummy.scale.set(v.height,1,v.height);kidDummy.updateMatrix();mesh.setMatrixAt(k,kidDummy.matrix);
    kidDummy.rotation.z=0;kidDummy.scale.set(v.height,v.height*(1+breath),v.height);kidDummy.updateMatrix();
   }else mesh.setMatrixAt(k,kidDummy.matrix);
   const palette=name==='head'||name==='arms'?KID_STYLE.skin:name==='shirt'?KID_STYLE.shirts:name==='pants'||name==='legs'?KID_STYLE.pants:name==='hair'?KID_STYLE.hair:KID_STYLE.shoes;
   const index=name==='head'||name==='arms'?v.skin:name==='shirt'?v.shirt:name==='pants'||name==='legs'?v.pants:name==='hair'?v.hair:v.shoes;
   if(name!=='shadow')mesh.setColorAt(k,kidColor.set(name==='band'?(p.band?THEME.navy:THEME.brass):rival&&name==='shirt'?THEME.cool:palette[index]));
  }
 }
 for(const mesh of team.parts){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
 }
 const rival=S.rivalN>0;
 RIVAL_ROPES.visible=RIVAL_EXTENSION.visible=rival;
 const rivalRows=PHYS.dramaChild(Math.min(S.rivalN,PHYS.C.rivalMax),0).rows;
 rivalRopes.forEach((r,j)=>r.visible=j<rivalRows);rivalJoins.forEach((r,j)=>r.visible=j<rivalRows);
 STAKE.visible=SIZE_MARK.visible=harness.visible=!rival;
 const rows=PHYS.dramaChild(n,0).rows;TEAM_ROPES.forEach((r,j)=>r.visible=j<rows);TEAM_JOINS.forEach((r,j)=>r.visible=j<rows);
 DINO_MODELS.forEach((g,j)=>{g.visible=!rival&&j===i;if(!rival&&j===i){g.pose(d.lean);g.position.x=PHYS.DRAMA.dinoX+d.dinoSkid;}});
 SIZE_MARK.position.y=PHYS.DRAMA.ground+d.height+.10;
 CASSETTES.forEach((g,j)=>{g.visible=j===gi;g.position.x=S.cassette.value*.16;g.userData.surface.uniforms.uTime.value=S.t.value;if(g.userData.grains)g.userData.grains.count=S.quality==='low'?PHYS.VIS.grains/2:PHYS.VIS.grains;});
 const u=controlValue(n);RAIL_HANDLE.position.x=PHYS.railWorldX(u);
 SLIDER.handle.position.x=SLIDER.x+(u-.5)*SLIDER.width;DIAL.knob.rotation.z=-u*Math.PI*1.7;
 FLAG.position.x=d.flagX;
 FLAG_PANEL.material.color.set(!rival?INK_CFG.diagram.kids:d.winner==='tie'?INK_CFG.diagram.reference:d.winner==='kids'?INK_CFG.diagram.kids:INK_CFG.diagram.rival);FLAG_PANEL.material.emissive.copy(FLAG_PANEL.material.color);
 FORCE_KNOTS.forEach((k,j)=>{k.position.x=k.userData.x+d.flagX*.2;k.position.y=Math.sin((DIRECTOR.eventLeft>0?DIRECTOR.clock*18:S.t.value*30)+j*Math.PI)*d.beadAmplitude;k.scale.setScalar(1+d.effort*.25);});
 const age=S.pullMode?DIRECTOR.clock-pullBurstAt:1.4-DIRECTOR.eventLeft;
 const burst=d.slip&&(S.pullMode?age<1.4:DIRECTOR.eventLeft>0);
 SLIP_DUST.visible=burst;SLIP_DUST.material.opacity=Math.max(0,1-age/1.4)*.85;
 for(let k=0;burst&&k<PHYS.VIS.dustCount;k++){
  const a=k*2.399963,r=(.06+age*.46)*(1+k%7/7),footZ=d.winner==='kids'?(rival?PHYS.dramaChild(Math.min(S.rivalN,PHYS.C.rivalMax),k%Math.min(S.rivalN,PHYS.C.rivalMax)).z:PHYS.DRAMA.dinoZ+(k%2?-.28:.28)):PHYS.dramaChild(n,k%n).z;
  kidDummy.position.set(d.slipX+Math.cos(a)*r,PHYS.DRAMA.ground+.03+Math.sin(Math.min(1,age/1.4)*Math.PI)*(.12+k%5*.045),footZ+Math.sin(a)*r);kidDummy.updateMatrix();SLIP_DUST.setMatrixAt(k,kidDummy.matrix);
 }SLIP_DUST.instanceMatrix.needsUpdate=true;
 const capacity=PHYS.displayState(n,SPECIES_KEYS[i],GROUND_VALUES[gi],S.t.value,S.rivalN);
 for(const [j,length]of [capacity.kidsLength,capacity.dinoLength].entries()){
  const color=j?(rival?INK_CFG.diagram.rival:INK_CFG.diagram.dino):INK_CFG.diagram.kids;BARS[j].fill.material.uniforms.uColor.value.set(color);BARS[j].cut.material.color.set(color);
  BARS[j].fill.scale.x=Math.max(.001,length);BARS[j].fill.material.uniforms.uTime.value=S.t.value;BARS[j].fill.material.uniforms.uUnit.value=PHYS.forceGlyph(PHYS.C.kidMuscle).length/Math.max(.001,length);BARS[j].fill.material.uniforms.uForce.value=length/PHYS.VIS.width;const compressed=j?capacity.dinoCompressed:capacity.kidsCompressed;
  BARS[j].sign.visible=compressed;BARS[j].cut.visible=compressed;BARS[j].cut.position.x=Math.max(.03,length-.08);
 }
 SWITCH.rotation.z=S.playing.value*.4-.2;
}
