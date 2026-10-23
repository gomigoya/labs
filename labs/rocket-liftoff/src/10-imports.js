import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

const QS=new URLSearchParams(location.search), LANG=QS.get('lang')==='en'?'en':'ko';document.documentElement.lang=LANG;
const THEME=Object.freeze({
  ceramic:0xe6e0d2, thrust:0xb594ff, weight:0xffaa63, support:0xf28db8, speed:0x64ead0,
  brass:0xb79859, graphite:0x303943, chrome:0xbcc7cc, warm:0xffb36b, cool:0x7dd3fc,
  wood:0x644936, wall:0x777a78, navy:0x344958, rubber:0x262a2c,
  sky:0xb5ddec, ground:0x6a432c, background:0x45494d, screen:0x11232e, grid:0x385363,
});
const V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pair=value=>({value,target:value});
// Independent categorical rails and observation state only; PHYS resolves every view.
const S={engines:pair(0),load:pair(0),g:pair(0),t:pair(0),playing:pair(0),ignited:pair(0),
  sound:pair(0),ui:pair(1),drag:null,snap:null,fly:null,shotIndex:1,
  vertical:innerWidth/innerHeight<.9,quality:'',layers:{},graphKeys:[],frames:0,ms:16.67,lastTime:0,uiKey:''};
function selection(){return PHYS.sceneSelection(S.engines.value,S.load.value,S.g.value);}
function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rand=mulberry32(730219),canvas=document.getElementById('gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.86;renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(THEME.background);scene.fog=new THREE.Fog(THEME.background,12,30);
const camera=new THREE.PerspectiveCamera(34,innerWidth/innerHeight,.03,50);
const ROOM=new THREE.Group(),CONSOLE=new THREE.Group(),HERO=new THREE.Group();scene.add(ROOM,CONSOLE,HERO);
const pmrem=new THREE.PMREMGenerator(renderer),environmentRoom=new RoomEnvironment();
scene.environment=pmrem.fromScene(environmentRoom,.04).texture;scene.environmentIntensity=.40;
environmentRoom.dispose();pmrem.dispose();RectAreaLightUniformsLib.init();
