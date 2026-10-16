// Epoch-aware ecological catalogue. Milestone windows are approximate illustrations,
// not fossil-range claims for real named species. No impossible modern quadrupeds in the Cambrian.
export const SPECIES = Object.freeze({
  trilobite:{guild:"marine",min:760,max:1010,habitat:"shelf",form:"trilobite",size:.65,speed:1.0,diet:"detritus"},
  earlyFish:{guild:"marine",min:790,max:1601,habitat:"openWater",form:"fish",size:.9,speed:3.4,diet:"omnivore"},
  ammonoid:{guild:"marine",min:880,max:1150,habitat:"openWater",form:"ammonoid",size:.9,speed:1.4,diet:"marine"},
  amphibian:{guild:"grazer",min:895,max:1601,habitat:"wetland",form:"amphibian",size:1.1,speed:2.3,diet:"insect"},
  earlySynapsid:{guild:"predator",min:955,max:1010,habitat:"land",form:"synapsid",size:1.35,speed:2.4,diet:"carnivore"},
  sauropod:{guild:"grazer",min:1025,max:1150,habitat:"land",form:"sauropod",size:3.8,speed:1.8,diet:"herbivore"},
  stegosaur:{guild:"grazer",min:1060,max:1125,habitat:"land",form:"stegosaur",size:2.4,speed:1.9,diet:"herbivore"},
  theropod:{guild:"predator",min:1015,max:1150,habitat:"land",form:"theropod",size:2.5,speed:4.1,diet:"carnivore"},
  pterosaur:{guild:"bird",min:1020,max:1150,habitat:"air",form:"pterosaur",size:1.5,speed:6.2,diet:"fish"},
  earlyBird:{guild:"bird",min:1100,max:1601,habitat:"air",form:"bird",size:.85,speed:7.2,diet:"omnivore"},
  mammoth:{guild:"grazer",min:1240,max:1375,habitat:"tundra",form:"mammoth",size:2.7,speed:2.5,diet:"herbivore"},
  deer:{guild:"grazer",min:1160,max:1601,habitat:"land",form:"deer",size:1.25,speed:4.5,diet:"herbivore"},
  bison:{guild:"grazer",min:1160,max:1601,habitat:"land",form:"bison",size:2,speed:3.4,diet:"herbivore"},
  elephant:{guild:"grazer",min:1190,max:1601,habitat:"savanna",form:"elephant",size:2.6,speed:2.7,diet:"herbivore"},
  rabbit:{guild:"grazer",min:1160,max:1601,habitat:"land",form:"rabbit",size:.65,speed:5.0,diet:"herbivore"},
  wolf:{guild:"predator",min:1190,max:1601,habitat:"land",form:"wolf",size:1.15,speed:5.4,diet:"carnivore"},
  lion:{guild:"predator",min:1190,max:1601,habitat:"savanna",form:"lion",size:1.65,speed:4.8,diet:"carnivore"},
  eagle:{guild:"bird",min:1190,max:1601,habitat:"air",form:"eagle",size:1.0,speed:7.3,diet:"carnivore"},
  waterfowl:{guild:"bird",min:1180,max:1601,habitat:"riverbank",form:"duck",size:.85,speed:5.5,diet:"omnivore"},
  human:{guild:"human",min:1250,max:1601,habitat:"land",form:"human",size:1,speed:2.5,diet:"omnivore"},
  // Representative body plans by broad period. Biome-only suitability is
  // intentional: geographical ranges are not scientifically reconstructed.
  jellyfish:{guild:"marine",min:730,max:1601,habitat:"openWater",form:"jellyfish",size:.7,speed:.8,diet:"plankton"},
  horseshoeCrab:{guild:"marine",min:830,max:1601,habitat:"shelf",form:"horseshoe",size:.75,speed:1.3,diet:"detritus"},
  shark:{guild:"marine",min:850,max:1601,habitat:"oceanDeep",form:"shark",size:2,speed:5.2,diet:"carnivore"},
  stingray:{guild:"marine",min:1080,max:1601,habitat:"shelf",form:"ray",size:1.25,speed:2.9,diet:"carnivore"},
  seaTurtle:{guild:"marine",min:1140,max:1601,habitat:"shelf",form:"turtle",size:1.3,speed:2.4,diet:"omnivore"},
  dolphin:{guild:"marine",min:1210,max:1601,habitat:"oceanDeep",form:"dolphin",size:1.8,speed:5.8,diet:"fish"},
  whale:{guild:"marine",min:1200,max:1601,habitat:"oceanDeep",form:"whale",size:3.5,speed:3.5,diet:"plankton"},
  salamander:{guild:"grazer",min:920,max:1601,habitat:"wetland",form:"amphibian",size:.7,speed:1.6,diet:"insect"},
  crocodile:{guild:"predator",min:1035,max:1601,habitat:"riverbank",form:"crocodilian",size:2.2,speed:2.4,diet:"carnivore"},
  tortoise:{guild:"grazer",min:1035,max:1601,habitat:"warm",form:"tortoise",size:.85,speed:.8,diet:"herbivore"},
  lizard:{guild:"predator",min:1080,max:1601,habitat:"warm",form:"lizard",size:.85,speed:2.6,diet:"insect"},
  snake:{guild:"predator",min:1110,max:1601,habitat:"warm",form:"snake",size:1.2,speed:2.6,diet:"carnivore"},
  triceratops:{guild:"grazer",min:1100,max:1150,habitat:"land",form:"ceratopsian",size:2.6,speed:2.2,diet:"herbivore"},
  ankylosaur:{guild:"grazer",min:1090,max:1150,habitat:"land",form:"ankylosaur",size:2.3,speed:1.7,diet:"herbivore"},
  hadrosaur:{guild:"grazer",min:1090,max:1150,habitat:"land",form:"hadrosaur",size:2.5,speed:2.5,diet:"herbivore"},
  spinosaurus:{guild:"predator",min:1100,max:1150,habitat:"wetland",form:"spinosaur",size:3.1,speed:2.7,diet:"fish"},
  giantDragonfly:{guild:"bird",min:945,max:1090,habitat:"air",form:"dragonfly",size:.9,speed:6.1,diet:"insect"},
  butterfly:{guild:"bird",min:1150,max:1601,habitat:"air",form:"butterfly",size:.55,speed:4.6,diet:"nectar"},
  owl:{guild:"bird",min:1190,max:1601,habitat:"air",form:"owl",size:.9,speed:5.2,diet:"carnivore"},
  parrot:{guild:"bird",min:1190,max:1601,habitat:"warm",form:"parrot",size:.75,speed:5.4,diet:"fruit"},
  flamingo:{guild:"bird",min:1190,max:1601,habitat:"riverbank",form:"flamingo",size:1.0,speed:5.0,diet:"filter"},
  penguin:{guild:"bird",min:1190,max:1601,habitat:"polarCoast",form:"penguin",size:.9,speed:3.2,diet:"fish"},
  seabird:{guild:"bird",min:1180,max:1601,habitat:"air",form:"seabird",size:.9,speed:6.4,diet:"fish"},
  stork:{guild:"bird",min:1190,max:1601,habitat:"riverbank",form:"stork",size:1.05,speed:5.4,diet:"fish"},
  bear:{guild:"predator",min:1160,max:1601,habitat:"cold",form:"bear",size:1.95,speed:3.5,diet:"omnivore"},
  fox:{guild:"predator",min:1180,max:1601,habitat:"land",form:"fox",size:.76,speed:5.8,diet:"omnivore"},
  tiger:{guild:"predator",min:1200,max:1601,habitat:"warm",form:"tiger",size:1.9,speed:4.9,diet:"carnivore"},
  leopard:{guild:"predator",min:1200,max:1601,habitat:"woodland",form:"leopard",size:1.4,speed:5.6,diet:"carnivore"},
  boar:{guild:"grazer",min:1160,max:1601,habitat:"land",form:"boar",size:1.05,speed:3.7,diet:"omnivore"},
  horse:{guild:"grazer",min:1160,max:1601,habitat:"grassland",form:"horse",size:1.65,speed:5.4,diet:"herbivore"},
  zebra:{guild:"grazer",min:1190,max:1601,habitat:"savanna",form:"zebra",size:1.6,speed:5.3,diet:"herbivore"},
  cow:{guild:"grazer",min:1310,max:1601,habitat:"grassland",form:"cattle",size:1.6,speed:2.7,diet:"herbivore"},
  sheep:{guild:"grazer",min:1310,max:1601,habitat:"grassland",form:"sheep",size:1.05,speed:2.6,diet:"herbivore"},
  goat:{guild:"grazer",min:1310,max:1601,habitat:"highland",form:"goat",size:.95,speed:3.4,diet:"herbivore"},
  pig:{guild:"grazer",min:1310,max:1601,habitat:"land",form:"pig",size:1.15,speed:3.0,diet:"omnivore"},
  giraffe:{guild:"grazer",min:1200,max:1601,habitat:"savanna",form:"giraffe",size:2.15,speed:4.2,diet:"herbivore"},
  rhinoceros:{guild:"grazer",min:1180,max:1601,habitat:"warm",form:"rhino",size:2.45,speed:3.1,diet:"herbivore"},
  hippopotamus:{guild:"grazer",min:1190,max:1601,habitat:"riverbank",form:"hippo",size:2.5,speed:2.7,diet:"herbivore"},
  camel:{guild:"grazer",min:1200,max:1601,habitat:"aridSteppe",form:"camel",size:1.85,speed:3.6,diet:"herbivore"},
  kangaroo:{guild:"grazer",min:1190,max:1601,habitat:"warm",form:"kangaroo",size:1.45,speed:5.1,diet:"herbivore"},
  gorilla:{guild:"grazer",min:1190,max:1601,habitat:"rainforest",form:"primate",size:1.7,speed:2.3,diet:"herbivore"}

});
export const PLANTS=Object.freeze({
  algalMat:{min:400,max:1601,habitat:"wetland",form:"mat"},
  earlyMoss:{min:870,max:1601,habitat:"wetland",form:"moss"},
  clubmoss:{min:890,max:1601,habitat:"wetland",form:"clubmoss"},
  horsetail:{min:890,max:1601,habitat:"wetland",form:"horsetail"},
  treeFern:{min:900,max:1601,habitat:"humid",form:"treeFern"},
  cycad:{min:960,max:1601,habitat:"warm",form:"cycad"},
  ginkgo:{min:1000,max:1601,habitat:"temperate",form:"ginkgo"},
  conifer:{min:965,max:1601,habitat:"temperate",form:"pine"},
  pine:{min:1050,max:1601,habitat:"temperate",form:"pine"},
  cedar:{min:1110,max:1601,habitat:"temperate",form:"cedar"},
  oak:{min:1120,max:1601,habitat:"temperate",form:"oak"},
  birch:{min:1120,max:1601,habitat:"cool",form:"birch"},
  palm:{min:1130,max:1601,habitat:"warm",form:"palm"},
  acacia:{min:1160,max:1601,habitat:"dry",form:"acacia"},
  willow:{min:1130,max:1601,habitat:"wetland",form:"willow"},
  mangrove:{min:1150,max:1601,habitat:"coastal",form:"mangrove"}
});
const climates=Object.freeze({
  cold:g=>g.temperature<10, warm:g=>g.temperature>16,
  wetland:g=>g.river||g.waterKind==="lake"||g.moisture>.64,
  coastal:g=>g.coastal&&g.temperature>15,
  humid:g=>g.moisture>.55, temperate:g=>g.temperature>=2&&g.temperature<=29,
  dry:g=>g.moisture<.40,water:g=>!g.land,
  grassland:g=>g.land&&g.moisture>=.25&&g.height<13,
  highland:g=>g.land&&g.height>=6,
  // Connected-ocean proxy: synthetic "ocean" and "sea" are allowed;
  // inland ponds/lakes and small shallow lagoons never contain pelagic megafauna.
  oceanDeep:g=>!g.land&&["ocean","sea"].includes(g.waterKind)&&g.height<=-9,
  openWater:g=>!g.land&&["ocean","sea"].includes(g.waterKind)&&g.height<=-2,
  shelf:g=>!g.land&&["ocean","sea","lagoon"].includes(g.waterKind)&&g.height<=-.4,
  savanna:g=>g.land&&g.temperature>17&&g.moisture>=.29&&g.moisture<.67&&
    g.height<12&&["grassland","forest"].includes(g.biome),
  woodland:g=>g.land&&g.temperature>12&&g.moisture>=.39&&g.moisture<.85,
  rainforest:g=>g.land&&g.temperature>=19&&g.moisture>.67&&g.height<11,
  aridSteppe:g=>g.land&&g.moisture>=.20&&g.moisture<.49&&g.height<12,
  riverbank:g=>g.land&&(g.river||g.waterKind==="lake"||g.moisture>.65)&&g.height<8,
  polarCoast:g=>g.land&&g.temperature<9&&g.coastal,
  tundra:g=>g.land&&g.temperature<10&&g.moisture>=.25,
  land:g=>g.land,air:g=>g.land,
});
export function permitted(def,era,g){
 if(!def||era<def.min||era>=def.max)return false;
 if(["water","openWater","oceanDeep","shelf"].includes(def.habitat))
   return (climates[def.habitat]||climates.water)(g);
 if(!g.land)return false;
 return (climates[def.habitat]||climates.land)(g);
}
export function chooseSpecies(era,g,rng,guild=null){
 const list=Object.entries(SPECIES).filter(([id,s])=>
   (!guild||s.guild===guild)&&permitted(s,era,g));
 if(!list.length)return null;
 return list[Math.floor(rng.next()*list.length)][0];
}
export function choosePlant(era,g,rng,tree=true){
 const list=Object.entries(PLANTS).filter(([id,s])=>
  permitted(s,era,g)&&(tree?s.form!=="mat"&&s.form!=="moss"&&s.form!=="horsetail":
    s.form==="mat"||s.form==="moss"||s.form==="horsetail"||s.form==="clubmoss"));
 if(!list.length)return null;
 return list[Math.floor(rng.next()*list.length)][0];
}
export function humanStyle(era,g){
 if(era<1250)return null;
 if(era<1310)return {period:"early-hominin",outfit:"minimal-wrap",material:"hide"};
 if(era<1410)return {period:"early-farming",outfit:g.temperature<14?"fur-tunic":"woven-tunic",material:"fiber"};
 if(era<1490)return {period:"historic",outfit:g.temperature<13?"layered-robe":"tunic",material:"textile"};
 if(era<1540)return {period:"industrial",outfit:"coat-and-trousers",material:"textile"};
 if(era<1590)return {period:"contemporary",outfit:g.temperature<12?"jacket":"shirt-and-trousers",material:"textile"};
 return {period:"speculative",outfit:"technical-suit",material:"composite"};
}

export const ECOLOGY_TRANSITIONS=Object.freeze([...new Set([
 ...Object.values(SPECIES).flatMap(s=>[s.min,s.max]),
 ...Object.values(PLANTS).flatMap(p=>[p.min,p.max]),
 1250,1310,1410,1490,1540,1590
])].filter(t=>t>=0&&t<=1600).sort((a,b)=>a-b));
export function ecologyStageAt(tick){
 let stage=0;
 for(const t of ECOLOGY_TRANSITIONS){if(t>tick)break;stage=t}
 return stage;
}
