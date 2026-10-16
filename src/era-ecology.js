// Epoch-aware ecological catalogue. Milestone windows are approximate illustrations,
// not fossil-range claims for real named species. No impossible modern quadrupeds in the Cambrian.
export const SPECIES = Object.freeze({
  trilobite:{guild:"marine",min:760,max:1010,habitat:"water",form:"trilobite",size:.65,speed:1.0,diet:"detritus"},
  earlyFish:{guild:"marine",min:790,max:1600,habitat:"water",form:"fish",size:.9,speed:3.4,diet:"omnivore"},
  ammonoid:{guild:"marine",min:880,max:1150,habitat:"water",form:"ammonoid",size:.9,speed:1.4,diet:"marine"},
  amphibian:{guild:"grazer",min:895,max:1600,habitat:"wetland",form:"amphibian",size:1.1,speed:2.3,diet:"insect"},
  earlySynapsid:{guild:"predator",min:955,max:1010,habitat:"land",form:"synapsid",size:1.35,speed:2.4,diet:"carnivore"},
  sauropod:{guild:"grazer",min:1025,max:1150,habitat:"land",form:"sauropod",size:3.8,speed:1.8,diet:"herbivore"},
  stegosaur:{guild:"grazer",min:1060,max:1125,habitat:"land",form:"stegosaur",size:2.4,speed:1.9,diet:"herbivore"},
  theropod:{guild:"predator",min:1015,max:1150,habitat:"land",form:"theropod",size:2.5,speed:4.1,diet:"carnivore"},
  pterosaur:{guild:"bird",min:1020,max:1150,habitat:"air",form:"pterosaur",size:1.5,speed:6.2,diet:"fish"},
  earlyBird:{guild:"bird",min:1100,max:1600,habitat:"air",form:"bird",size:.85,speed:7.2,diet:"omnivore"},
  mammoth:{guild:"grazer",min:1240,max:1375,habitat:"cold",form:"mammoth",size:2.7,speed:2.5,diet:"herbivore"},
  deer:{guild:"grazer",min:1160,max:1600,habitat:"land",form:"deer",size:1.25,speed:4.5,diet:"herbivore"},
  bison:{guild:"grazer",min:1160,max:1600,habitat:"land",form:"bison",size:2,speed:3.4,diet:"herbivore"},
  elephant:{guild:"grazer",min:1190,max:1600,habitat:"warm",form:"elephant",size:2.6,speed:2.7,diet:"herbivore"},
  rabbit:{guild:"grazer",min:1160,max:1600,habitat:"land",form:"rabbit",size:.65,speed:5.0,diet:"herbivore"},
  wolf:{guild:"predator",min:1190,max:1600,habitat:"land",form:"wolf",size:1.15,speed:5.4,diet:"carnivore"},
  lion:{guild:"predator",min:1190,max:1600,habitat:"warm",form:"lion",size:1.65,speed:4.8,diet:"carnivore"},
  eagle:{guild:"bird",min:1190,max:1600,habitat:"air",form:"eagle",size:1.0,speed:7.3,diet:"carnivore"},
  waterfowl:{guild:"bird",min:1180,max:1600,habitat:"wetland",form:"duck",size:.85,speed:5.5,diet:"omnivore"},
  human:{guild:"human",min:1250,max:1600,habitat:"land",form:"human",size:1,speed:2.5,diet:"omnivore"}
});
export const PLANTS=Object.freeze({
  algalMat:{min:400,max:1600,habitat:"wetland",form:"mat"},
  earlyMoss:{min:870,max:1600,habitat:"wetland",form:"moss"},
  clubmoss:{min:890,max:1600,habitat:"wetland",form:"clubmoss"},
  horsetail:{min:890,max:1600,habitat:"wetland",form:"horsetail"},
  treeFern:{min:900,max:1600,habitat:"humid",form:"treeFern"},
  cycad:{min:960,max:1600,habitat:"warm",form:"cycad"},
  ginkgo:{min:1000,max:1600,habitat:"temperate",form:"ginkgo"},
  conifer:{min:965,max:1600,habitat:"temperate",form:"pine"},
  pine:{min:1050,max:1600,habitat:"temperate",form:"pine"},
  cedar:{min:1110,max:1600,habitat:"temperate",form:"cedar"},
  oak:{min:1120,max:1600,habitat:"temperate",form:"oak"},
  birch:{min:1120,max:1600,habitat:"cool",form:"birch"},
  palm:{min:1130,max:1600,habitat:"warm",form:"palm"},
  acacia:{min:1160,max:1600,habitat:"dry",form:"acacia"},
  willow:{min:1130,max:1600,habitat:"wetland",form:"willow"},
  mangrove:{min:1150,max:1600,habitat:"coastal",form:"mangrove"}
});
const climates=Object.freeze({
  cold:g=>g.temperature<10, warm:g=>g.temperature>16,
  wetland:g=>g.river||g.waterKind==="lake"||g.moisture>.64,
  coastal:g=>g.coastal&&g.temperature>15,
  humid:g=>g.moisture>.55, temperate:g=>g.temperature>=2&&g.temperature<=29,
  dry:g=>g.moisture<.40,water:g=>!g.land,
  land:g=>g.land,air:g=>g.land,
});
export function permitted(def,era,g){
 if(!def||era<def.min||era>=def.max)return false;
 if(def.habitat==="water")return !g.land;
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
