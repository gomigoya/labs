// Space palette; hoisted accessor is available during earlier scene construction.
var INK_CFG = inkConfig();
function inkConfig(){return INK_CFG || (INK_CFG=Object.freeze({
 ink:'#111122',paper:'#1c1d3a',shadow:'#3f55a8',shadowOpacity:.50,
 silhouettePx:3.2,silhouetteMinPx:1.3,refDist:6,farFade:[24,48],innerPx:1.1,innerOpacity:.72,
 depthThreshold:.018,normalThreshold:.28,wobblePx:.8,
 ramp:[0,128,255],dark:[.43,.49,.69],mid:[.83,.84,.81],light:[1.10,1.06,.97],
 grain:.025,stain:.006,seed:73.0219,fog:[24,48],metal:'#b9c0c5',
 ambient:'#a6b8dc',ambientIntensity:.65,key:'#fff0d0',keyIntensity:110,
 keyPosition:[-4,7,5],keyTarget:[0,1.5,0],shadowMap:[2048,1024],shadowBias:-.0003,shadowNormalBias:.018,
 diagram:{ink:0x221d18,borderPx:1.5,screen:0xf4efe3,grid:0xb2b3ad,reference:0x393e42,tide:0x377f79,warm:0xa66b29,red:0xb55d67},
 space:{star:'#f4efe3',nebula:[0x62547b,0x467477,0x77708d],disk:[0xb86d49,0xd89b62,0xf1c68a],hole:0x080812,
  tide:0xa9d8d1,reference:0xf4efe3,brass:0xd8b779,graphite:0x929aaf,chrome:0xc7d0d4,warm:0xe8b57d,cool:0xb3d5ea,red:0xe69c9c}
}));}
