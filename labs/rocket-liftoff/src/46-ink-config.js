// Coastal dawn palette. Hoisted accessor supports scene construction before 46.
var INK_CFG = inkConfig();
function inkConfig() {
 return INK_CFG || (INK_CFG = Object.freeze({
  ink:'#221d18',paper:'#efe3cf',shadow:'#3f55a8',shadowOpacity:.50,
  silhouettePx:3.2,silhouetteMinPx:1.3,refDist:6,farFade:[22,38],innerPx:1.1,innerOpacity:.72,
  depthThreshold:.018,normalThreshold:.28,wobblePx:.8,
  ramp:[0,128,255],dark:[.43,.49,.69],mid:[.83,.84,.81],light:[1.10,1.06,.97],
  grain:.025,stain:.006,seed:73.0219,fog:[14,38],
  metal:'#b9c0c5',ambient:'#a6b8dc',ambientIntensity:.65,
  key:'#fff0d0',keyIntensity:110,keyPosition:[-4,7,5],keyTarget:[0,1.75,0],
  shadowMap:[2048,1024],shadowBias:-.0003,shadowNormalBias:.018,
  apparatus:{ceramic:0xf4efe3,graphite:0x706b62,navy:0x899ba5,rubber:0x67665e},
  flame:0xd79755,
  coast:{concrete:0xadb0aa,steel:0x85939a,safety:0xc4a461,sand:0xb6b29c,
   foliage:0x829186,ocean:0x8babb5,haze:0xefe3cf,smoke:0xb9bbb4,building:0x9ba7a5,
   sky:['#b7ccd3','#d6dcd4','#e6c3a1','#efe3cf'],cloud:'#f4efe3',wave:0xbfcfd0},
  diagram:{ink:0x221d18,borderPx:1.5,screen:0xf4efe3,grid:0xb2b3a2,reference:0x393e42,
   thrust:0x7863a6,weight:0xc57d24,support:0xb55d77,speed:0x37795d,active:0xe8b23a}
 }));
}
