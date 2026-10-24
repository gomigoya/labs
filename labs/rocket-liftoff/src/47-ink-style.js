/* Portable INK engine. Requires THREE and ShaderPass; configuration is supplied by 46.
 * INK_CFG contract (colors accept THREE.Color inputs; distances are world units):
 * Required | ink, paper, shadow, shadowOpacity | composite/shadow colors and opacity
 * Required | ramp[3], dark[3], mid[3], light[3], keyPosition[3] | toon bands/light direction
 * Required | silhouettePx, silhouetteMinPx, refDist, innerPx, innerOpacity | CSS pixel widths
 * Required | farFade[near,far], depthThreshold, normalThreshold | linear-depth edge rejection
 * Required | wobblePx, seed, grain, stain | deterministic paper/line texture
 * Required | metal | replacement color for metallic materials
 * Optional | keyTarget[3] (default [0,0,0]) | light direction target
 * Optional | fog, ambient*, key*, shadowMap/Bias/NormalBias, diagram, environment palette
 *          | consumed by host modules only; no dependency in this engine
 * makeOutlinePass(scene,camera,{wobble=.5,lowQuality=()=>false}); inkInner=false masks normal edges; inkSkip=true leaves a mesh out of the edge pass (distant scenery).
 */
const INK = (() => {
 const cfg=INK_CFG, converted=new WeakMap(), styled=new WeakSet();
 const ramp=new THREE.DataTexture(new Uint8Array(cfg.ramp.flatMap(v=>[v,v,v,255])),3,1,THREE.RGBAFormat);
 ramp.minFilter=ramp.magFilter=THREE.NearestFilter;ramp.generateMipmaps=false;ramp.needsUpdate=true;
 const patch=material=>{
  if(styled.has(material))return material;
  styled.add(material);material.gradientMap=ramp;
  // Keep diffuse maps, vertex/instance colors and emissive contributions; discard light sheen.
  material.onBeforeCompile=shader=>{
   shader.uniforms.inkDirection={value:new THREE.Vector3(...cfg.keyPosition).sub(new THREE.Vector3(...(cfg.keyTarget||[0,0,0]))).normalize()};
   shader.uniforms.inkDark={value:new THREE.Vector3(...cfg.dark)};
   shader.uniforms.inkMid={value:new THREE.Vector3(...cfg.mid)};
   shader.uniforms.inkLight={value:new THREE.Vector3(...cfg.light)};
   shader.uniforms.inkShadow={value:new THREE.Color(cfg.shadow)};
   shader.uniforms.inkShadowOpacity={value:cfg.shadowOpacity};
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
    uniform vec3 inkDirection, inkDark, inkMid, inkLight, inkShadow;
    uniform float inkShadowOpacity;`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <shadowmap_pars_fragment>','#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>');
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
    vec3 inkViewLight=normalize((viewMatrix*vec4(inkDirection,0.0)).xyz);
    float inkFacing=dot(normal,inkViewLight)*0.5+0.5;
    float inkBand=texture2D(gradientMap,vec2(inkFacing,0.5)).r;
    vec3 inkTone=inkBand<0.25?inkDark:(inkBand<0.75?inkMid:inkLight);
    float inkOcclusion=step(0.5,getShadowMask());
    outgoingLight=diffuseColor.rgb*inkTone*mix(mix(vec3(1.0),inkShadow,inkShadowOpacity),vec3(1.0),inkOcclusion)+totalEmissiveRadiance;
    #include <opaque_fragment>`);
  };
  material.customProgramCacheKey=()=> 'ink-three-band-v1';material.needsUpdate=true;return material;
 };
 function convert(material){
  if(material.isMeshToonMaterial)return patch(material);
  if(!(material.isMeshStandardMaterial||material.isMeshPhysicalMaterial||material.isMeshPhongMaterial))return material;
  if(converted.has(material))return converted.get(material);
  const next=new THREE.MeshToonMaterial();
  for(const key of ['name','map','alphaMap','aoMap','aoMapIntensity','lightMap','lightMapIntensity','emissiveMap','emissiveIntensity','normalMap','normalMapType','bumpMap','bumpScale','displacementMap','displacementScale','displacementBias','side','shadowSide','transparent','opacity','alphaTest','depthTest','depthWrite','colorWrite','vertexColors','flatShading','fog','blending','blendSrc','blendDst','blendEquation','premultipliedAlpha','polygonOffset','polygonOffsetFactor','polygonOffsetUnits','visible']){
   if(material[key]!==undefined)next[key]=material[key];
  }
  next.color.copy(['brass','chrome'].includes(material.name)||material.metalness>.5?new THREE.Color(cfg.metal):material.color);
  next.emissive.copy(material.emissive);next.normalScale.copy(material.normalScale);
  next.userData={...material.userData};converted.set(material,patch(next));return next;
 }
 function convertMaterials(root){
  const extraLights=[];
  root.traverse(o=>{
   if(o.isLight&&!o.isSpotLight&&!o.isAmbientLight)extraLights.push(o);
   if(!o.material)return;o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);
   for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.isShadowMaterial){m.color.set(cfg.shadow);m.opacity=cfg.shadowOpacity;}
  });
  // Later presentation modules can retain their light handles without lighting the scene.
  for(const light of extraLights)light.removeFromParent();
 }
 const vertexShader='varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
 function makeOutlinePass(scene,camera,{wobble:inputWobble=.5,lowQuality=()=>false}={}){
  const target=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
  target.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
  const normals=new THREE.MeshNormalMaterial();normals.blending=THREE.NoBlending;
  // Alpha is a per-object inner-edge mask; RGB still stores occluding normals.
  const maskedNormals=normals.clone();maskedNormals.opacity=0;maskedNormals.transparent=false;
  maskedNormals.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace(/}\s*$/, 'gl_FragColor.a=0.0;\n}');};
  const edgeTarget=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:false});
  const raw=Number(inputWobble),wobble=Number.isFinite(raw)?Math.max(0,Math.min(1,raw)):.5;
  const edge=new ShaderPass({vertexShader,uniforms:{
   tDiffuse:{value:null},tDepth:{value:target.depthTexture},tNormal:{value:target.texture},
   resolution:{value:new THREE.Vector2(1,1)},nearFar:{value:new THREE.Vector2(camera.near,camera.far)},
   widths:{value:new THREE.Vector2(cfg.silhouettePx,cfg.innerPx)},thresholds:{value:new THREE.Vector2(cfg.depthThreshold,cfg.normalThreshold)},
   distanceStyle:{value:new THREE.Vector2(cfg.refDist,cfg.silhouetteMinPx/cfg.silhouettePx)},
   farFade:{value:new THREE.Vector2(...cfg.farFade)},inverseProjection:{value:camera.projectionMatrixInverse.clone()},
   wobble:{value:wobble*cfg.wobblePx},seed:{value:cfg.seed}},fragmentShader:`
   precision highp float;
   uniform sampler2D tDepth,tNormal;
   uniform vec2 resolution,nearFar,widths,thresholds,distanceStyle,farFade;
   uniform mat4 inverseProjection;
   uniform float wobble,seed;
   varying vec2 vUv;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+seed)*43758.5453);}
   float noise(vec2 p){vec2 a=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(a),hash(a+vec2(1,0)),f.x),mix(hash(a+vec2(0,1)),hash(a+vec2(1,1)),f.x),f.y);}
   float depth(vec2 uv){float d=texture2D(tDepth,uv).r;return nearFar.x*nearFar.y/(nearFar.y-d*(nearFar.y-nearFar.x));}
   void main(){
    vec2 px=1.0/resolution;
    vec2 drift=(vec2(noise(vUv*resolution/36.0),noise(vUv*resolution/36.0+19.7))*2.0-1.0)*wobble;
    vec2 uv=clamp(vUv+drift*px,px*.5,vec2(1.0)-px*.5);
    float d=depth(uv),silhouette=0.0,inner=0.0;
    // Reconstruct ray length so d is camera-to-surface distance in world units.
    vec4 ray=inverseProjection*vec4(uv*2.0-1.0,1.0,1.0);
    float worldDistance=d*length(ray.xyz/ray.z);
    float ratio=clamp(distanceStyle.x/max(worldDistance,nearFar.x),distanceStyle.y,1.0);
    float fade=1.0-smoothstep(farFade.x,farFade.y,d);
    if(d>=nearFar.y*.999){gl_FragColor=vec4(0.0);return;}
    vec3 n=texture2D(tNormal,uv).xyz*2.0-1.0;
    for(int i=0;i<8;i++){
     float a=float(i)*0.78539816339;vec2 dir=vec2(cos(a),sin(a));
     float other=depth(uv+dir*px*widths.x*ratio*.5);
     float geometryPair=1.0-step(nearFar.y*.999,other);
     // A step must also break the symmetric opposite sample, so grazing flat ground (linear in 1/z) never inks.
     float opposite=depth(uv-dir*px*widths.x*ratio*.5);
     float stepJump=step(thresholds.x,abs(d-other)/max(min(d,other),nearFar.x))*step(thresholds.x*.5,abs(other+opposite-2.0*d)/max(min(d,other),nearFar.x));
     silhouette=max(silhouette,geometryPair*stepJump);
     vec2 q=uv+dir*px*widths.y*ratio*.5;
     vec3 nn=texture2D(tNormal,q).xyz*2.0-1.0;
     float sameSurface=1.0-step(thresholds.x,abs(d-depth(q))/max(min(d,depth(q)),nearFar.x));
     float innerMask=texture2D(tNormal,uv).a*texture2D(tNormal,q).a;
     inner=max(inner,step(thresholds.y,1.0-dot(n,nn))*sameSurface*innerMask*(1.0-step(nearFar.y*.999,depth(q))));
    }
    gl_FragColor=vec4(silhouette*fade,inner*fade,0.0,1.0);
   }`});
  const paper=new ShaderPass({vertexShader,uniforms:{tDiffuse:{value:null},tEdges:{value:edgeTarget.texture},
   ink:{value:new THREE.Color(cfg.ink)},paper:{value:new THREE.Color(cfg.paper)},resolution:{value:new THREE.Vector2(1,1)},
   grain:{value:cfg.grain},stain:{value:cfg.stain},seed:{value:cfg.seed},innerOpacity:{value:cfg.innerOpacity}},fragmentShader:`
   precision highp float;
   uniform sampler2D tDiffuse,tEdges;
   uniform vec3 ink,paper;
   uniform vec2 resolution;
   uniform float grain,stain,seed,innerOpacity;
   varying vec2 vUv;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+seed)*43758.5453);}
   void main(){
    vec3 color=texture2D(tDiffuse,vUv).rgb;vec2 edges=texture2D(tEdges,vUv).rg;
    color=mix(color,paper,0.018*vUv.y);
    color*=1.0+0.025*(vUv.y-0.5);
    color=mix(color,ink,max(edges.r,edges.g*innerOpacity));
    float grainValue=(hash(floor(vUv*resolution))*2.0-1.0)*grain;
    float stainValue=sin(vUv.x*17.0+seed)*sin(vUv.y*13.0+2.0)*stain;
    gl_FragColor=vec4(max(vec3(0.0),color*(1.0+grainValue+stainValue)),1.0);
   }`});
  // ShaderPass clones input uniforms: attachment textures must keep their actual target identity.
  edge.uniforms.tDepth.value=target.depthTexture;edge.uniforms.tNormal.value=target.texture;
  paper.uniforms.tEdges.value=edgeTarget.texture;
  // One composer pass owns its auxiliary edge draw and the final paper draw.
  const drawPaper=paper.render.bind(paper),setPaperSize=paper.setSize.bind(paper);
  paper.setSize=(w,h)=>{target.setSize(w,h);edgeTarget.setSize(w,h);edge.uniforms.resolution.value.set(w,h);paper.uniforms.resolution.value.set(w,h);setPaperSize(w,h);};
  paper.render=(renderer,writeBuffer,readBuffer,dt,maskActive)=>{
   const hidden=[],replaced=[],background=scene.background,fog=scene.fog,override=scene.overrideMaterial,clear=new THREE.Color();
   const savedTarget=renderer.getRenderTarget(),alpha=renderer.getClearAlpha(),shadowUpdate=renderer.shadowMap.autoUpdate;renderer.getClearColor(clear);
   try{
    scene.traverseVisible(o=>{if(!o.material)return;const mats=Array.isArray(o.material)?o.material:[o.material];
     if(!o.isMesh||o.userData.inkSkip||mats.some(m=>m.visible===false||m.transparent||m.opacity<1||m.blending===THREE.AdditiveBlending||m.isShaderMaterial||m.isShadowMaterial||m.depthWrite===false)) {hidden.push(o);o.visible=false;}
    });
    scene.traverseVisible(o=>{if(!o.isMesh||!o.material)return;replaced.push([o,o.material]);o.material=o.userData.inkInner===false?maskedNormals:normals;});
    scene.background=null;scene.fog=null;scene.overrideMaterial=null;renderer.shadowMap.autoUpdate=false;
    renderer.setClearColor(0x000000,0);renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);
   }finally{for(const [o,m]of replaced)o.material=m;for(const o of hidden)o.visible=true;scene.background=background;scene.fog=fog;scene.overrideMaterial=override;renderer.shadowMap.autoUpdate=shadowUpdate;renderer.setClearColor(clear,alpha);renderer.setRenderTarget(savedTarget);}
   edge.uniforms.nearFar.value.set(camera.near,camera.far);
   edge.uniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);
   edge.uniforms.wobble.value=lowQuality()?0:wobble*cfg.wobblePx;
   // Width is in CSS pixels, independently of capture size and renderer pixel ratio.
   edge.uniforms.widths.value.set(cfg.silhouettePx,cfg.innerPx).multiplyScalar(renderer.getPixelRatio());
   edge.render(renderer,edgeTarget,readBuffer,dt,false);
   drawPaper(renderer,writeBuffer,readBuffer,dt,maskActive);
  };
  paper.dispose=()=>{target.dispose();edgeTarget.dispose();normals.dispose();maskedNormals.dispose();edge.dispose();paper.material.dispose();paper._fsQuad.dispose();};
  return paper;
 }
 return {convert,convertMaterials,makeOutlinePass,ramp,toon:(color,opts={})=>patch(new THREE.MeshToonMaterial({color,...opts,gradientMap:ramp}))};
})();
