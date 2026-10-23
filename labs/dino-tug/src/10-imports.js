import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

const THEME = Object.freeze({ kids: 0xf4a04d, dino: 0x7ac59d, muscle: 0xb296e0, friction: 0xf29db5,
 brass: 0xb79859, graphite: 0x303943, chrome: 0xbcc7cc, warm: 0xffb36b, cool: 0x7dd3fc,
 bone: 0xe2d7ba, wood: 0x644936, wall: 0x746657, navy: 0x303e50, rubber: 0x262a2c,
 background: 0x514b43, fog: 0x776e60, screen: 0x11232e, grid: 0x385363, reference: 0xe1e9e6,
 glass: 0xb6e0ed, sand: 0xc6a36e, gravel: 0x999c94, asphalt: 0x41494e, leaf: 0x587e66 });
