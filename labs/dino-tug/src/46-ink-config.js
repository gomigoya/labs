// Laboratory palette and lighting. Hoisted accessor supports earlier scene construction.
var INK_CFG = inkConfig();
function inkConfig() {
 return INK_CFG || (INK_CFG = Object.freeze({
  ink: '#221d18', paper: '#e9e8d3', shadow: '#3f55a8', shadowOpacity: .50,
  silhouettePx: 3.2, silhouetteMinPx: 1.3, refDist: 12, farFade: [32,54], innerPx: 1.1, innerOpacity: .72,
  depthThreshold: .018, normalThreshold: .28, wobblePx: .8,
  ramp: [0,128,255], dark: [.43,.49,.69], mid: [.83,.84,.81], light: [1.10,1.06,.97],
  grain: .025, stain: .006, seed: 73.0219, fog: [19,54],
  metal: '#b9c0c5', ambient: '#a6b8dc', ambientIntensity: .65,
  key: '#fff0d0', keyIntensity: 110, keyPosition: [-4,7,5], keyTarget: [0,1.5,0],
  shadowMap: [2048,1024], shadowBias: -.0003, shadowNormalBias: .018,
  biome: {mud:0xa49b78,moss:0x87916c,bark:0x686750,stone:0x959887,foliage:0x718260,
   rear:0x9ba78b,middle:0x859573,near:0x718260,cavity:0x626954,litter:0x929574,volcano:0x929b85,crater:0x67715b,
   trail:['#b1a783','#99916f','#c1b795'],sun:0xffe7a0},
  diagram: {ink:0x221d18,borderPx:1.5,screen:0xf4efe3,grid:0xb2b3a2,reference:0x393e42,kids:0xc57d24,dino:0x37795d,muscle:0x7863a6,friction:0xb55d77}
 }));
}
