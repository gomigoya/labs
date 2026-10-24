// Moon orbital laboratory: all ink, paper, lighting and environment color decisions.
var INK_CFG = inkConfig();
function inkConfig() {
 return INK_CFG || (INK_CFG = Object.freeze({
  ink:'#161522', paper:'#232848', shadow:'#3f55a8', shadowOpacity:.50,
  silhouettePx:3.2, silhouetteMinPx:1.3, refDist:3.6, farFade:[24,38], innerPx:1.1, innerOpacity:.72,
  depthThreshold:.018, normalThreshold:.28, wobblePx:.8,
  ramp:[0,128,255], dark:[.43,.49,.69], mid:[.83,.84,.81], light:[1.10,1.06,.97],
  grain:.025, stain:.006, seed:73.0219, fog:[23,38],
  metal:'#bbc2ce', ambient:'#a6b8dc', ambientIntensity:.65,
  key:'#fff0d0', keyIntensity:26, keyPosition:[-2.2,4.2,3.3], keyTarget:[-.55,1.30,0],
  shadowMap:[2048,1024], shadowBias:-.0003, shadowNormalBias:.018,
  space:{stars:0xf4efe3,galaxy:0x9caec7,ocean:0x6898bf,land:0xabc68b,cloud:0xf4efe3,
   sun:0xe8b23a,halo:0xf0d995,moon:0xd9dce2,core:0x6c8dac,grid:0xc2d2dc},
  apparatus:{moon:0xe5e7ec,tide:0x94cfca,sea:0x6898bf,reference:0xf4efe3,
   brass:0xbbc2ce,graphite:0xf4efe3,chrome:0xbbc2ce,warm:0xe8b23a,cool:0xc2d2dc,red:0xe59088},
  diagram:{ink:0x221d18,borderPx:1.5,screen:0xf4efe3,grid:0xb6b5ab,reference:0x393e42,
   tide:0x377f88,sea:0x38658b,accent:0xb57924,red:0xb65450}
 }));
}
