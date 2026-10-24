// Hoisted palette accessor: earlier scene modules consume the same configuration.
var INK_CFG = inkConfig();
function inkConfig() {
 return INK_CFG || (INK_CFG = Object.freeze({
  ink:'#14131d', paper:'#dfe6d8', shadow:'#3f55a8', shadowOpacity:.50,
  silhouettePx:3.2, silhouetteMinPx:1.3, refDist:7, farFade:[18,36], innerPx:.8, innerOpacity:.65,
  depthThreshold:.018, normalThreshold:.28, wobblePx:.8,
  ramp:[0,128,255], dark:[.43,.49,.69], mid:[.83,.84,.81], light:[1.10,1.06,.97],
  grain:.025, stain:.006, seed:73.0219, fog:[12,36],
  metal:'#b9c0c5', ambient:'#a6b8dc', ambientIntensity:.65,
  key:'#fff0d0', keyIntensity:80, keyPosition:[-2.2,4.2,3.3], keyTarget:[0,1.85,0],
  shadowMap:[2048,1024], shadowBias:-.0003, shadowNormalBias:.018,
  diagram:{ink:0x221d18,borderPx:1.5,screen:0xf4efe3,grid:0xb2b3a2,reference:0x393e42,force:0xb06e29,mint:0x37795d,cool:0x4e6f9e,red:0xb55d65},
  apparatus:{graphite:0x7c858a,rubber:0x5a646d},
  worldScenery:{
  earth:   {paper:0xdfe6d8,haze:0xdfe6d8,ground:0xa0ad87,relief:0x85977b,terrain:'mountains',orb:null,cloud:0.28,stars:0},
  moon:    {paper:0x171d35,haze:0x171d35,ground:0xb7b9bd,relief:0x9198a8,terrain:'craters',orb:'earth',cloud:0,stars:1},
  pluto:   {paper:0x20283f,haze:0x20283f,ground:0xbdc4c7,relief:0x939eae,terrain:'ice',orb:'charon',cloud:0,stars:1},
  mars:    {paper:0xecd0b6,haze:0xecd0b6,ground:0xc59276,relief:0xa77f72,terrain:'volcano',orb:'phobos',cloud:0.12,stars:0},
  venus:   {paper:0xe6dbb3,haze:0xe6dbb3,ground:0xb8ab81,relief:0x9c987e,terrain:'ridges',orb:null,cloud:0.9,stars:0},
  saturn:  {paper:0xece0c4,haze:0xece0c4,ground:0xc5b79a,relief:0xaaa594,terrain:'clouds',orb:'titan',cloud:1,stars:0},
  jupiter: {paper:0xf0dfba,haze:0xf0dfba,ground:0xc8af91,relief:0xad9789,terrain:'clouds',orb:'io',cloud:1,stars:0},
  sun:     {paper:0xe8bd94,haze:0xe8bd94,ground:0xd6a16e,relief:0xba8c73,terrain:'plasma',orb:null,cloud:0.6,stars:0},
  neutron: {paper:0x1b2940,haze:0x1b2940,ground:0xa8bac5,relief:0x839cba,terrain:'crust',orb:null,cloud:0,stars:1},
  space:   {paper:0x151e34,haze:0x151e34,ground:0x9cabbc,relief:0x8597b2,terrain:'void',orb:'earth',cloud:0,stars:1}
}
 }));
}
