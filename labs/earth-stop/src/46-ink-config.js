// Earth-stop values. Hoisted accessor supports scene construction before module 46.
var INK_CFG = inkConfig();
function inkConfig() {
 return INK_CFG || (INK_CFG = Object.freeze({
  ink:'#141522', paper:'#1e2442', shadow:'#3f55a8', shadowOpacity:.50,
  depthBackdropRatio:.98, silhouettePx:3.2, silhouetteMinPx:1.3, refDist:5, farFade:[24,38], innerPx:1.1, innerOpacity:.72,
  depthThreshold:.018, normalThreshold:.28, wobblePx:.8,
  ramp:[0,128,255], dark:[.43,.49,.69], mid:[.83,.84,.81], light:[1.10,1.06,.97],
  grain:.025, stain:.006, seed:73.0219, fog:[25,40],
  metal:'#b9c0c5', ambient:'#a6b8dc', ambientIntensity:.65,
  key:'#fff0d0', keyIntensity:110, keyPosition:[-2.2,4.2,3.3], keyTarget:[0,1.95,0],
  shadowMap:[2048,1024], shadowBias:-.0003, shadowNormalBias:.018,
  environment:{sea:['#344961','#526d83','#7893a3'],land:['#727861','#96997a','#b9b18b'],
   cloud:'#f4efe3',atmosphere:'#91b6d2',star:'#f4efe3',sun:'#e8b23a',halo:'#e8d6a4',
   globeSea:['#346399','#508fb2','#83bac9'],globeLand:['#6d8859','#a3b275','#c8b57c']},
  diagram:{ink:0x221d18,borderPx:1.5,screen:0xf4efe3,grid:0xb2b3a2,reference:0x393e42,
   lensNight:0xbab8ab,lensDay:0xe6d1a1,velocity:0x37795d,warm:0x936114,cool:0x435b85,red:0xb55d77}
 }));
}
