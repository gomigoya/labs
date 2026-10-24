import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const QS = new URLSearchParams(location.search);
const LANG = QS.get('lang') === 'en' ? 'en' : 'ko';
document.documentElement.lang = LANG;
const THEME = Object.freeze({ mint: 0x64ead0, force: 0xff9b53, reference: 0xe5e7ec,
  brass: 0xb79859, graphite: 0x303943, chrome: 0xbcc7cc, warm: 0xffb36b, cool: 0x7dd3fc,
  red: 0xe66b62, wood: 0x644936, wall: 0x62544b, navy: 0x303e50, rubber: 0x262a2c,
  skyTop: '#182d48', skyBottom: '#b98973', screen: '#11232e', grid: '#385363',
  background: 0x30251f, screwInk: 0x34373b, fog: 0x514137, white: 0xffffff, hemiGround: 0x6a432c, hemiSky: 0xb8d7e4, whiteInk: '#ffffff', night: '#18233f', panel: '#1c3040', horizon: '#273c4b', grain: '#30201a13', joint: '#30251f', dusk: '#354d67', panelGrid: '#477083', floor: '#674b38', plankA: '#70503a', plankB: '#795a43', diagram: '#9dd5df', skyGlow: '#b17c62', diagramPoint: '#ffcc8c',
  bodies: Object.freeze([0x4f9eae,0xbec4cc,0xb89881,0xc97953,0xd9b879,0xdbbb8d,0xbe997b,0xffc16c,0x9bcfff,0x7790aa]) });
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pair = value => ({ value, target: value });
const S = { body: pair(0), nWeights: pair(5), t: pair(0), playing: pair(0), sound: pair(0), ui: pair(1),
  runId: 0, trial: null, drag: null, snap: null, fly: null, shotIndex: 1,
  vertical: innerWidth / innerHeight < 0.9, quality: '', layers: {}, graphKeys: [],
  frames: 0, ms: 16, sampleMs: 0, sampleFrames: 0, lastTime: 0, autoLevel: 0 };
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rand = mulberry32(731023);
