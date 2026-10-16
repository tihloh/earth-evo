import test from "node:test";
import assert from "node:assert/strict";
import {SPECIES,PLANTS,chooseSpecies,choosePlant,permitted,humanStyle} from "../src/era-ecology.js";
import {SurfaceWorld} from "../src/surface-world.js";
import {sampleGeography} from "../src/geography.js";
import {LANDFORMS,WATERS,classifyPhysicalFeature,detailedPhysicalFeature} from "../src/physical-features.js";
const rng={next:()=>.23};
const land={land:true,river:false,temperature:23,moisture:.73,coastal:false,waterKind:null,biome:"forest",height:3,lat:8,lon:20};
const sea={...land,land:false,waterKind:"ocean",height:-3};
test("Paleozoic sea creatures appear before terrestrial dinosaurs or humans",()=>{
 assert.equal(chooseSpecies(760,sea,rng,"marine"),"trilobite");
 assert.equal(chooseSpecies(760,land,rng,"grazer"),null);
 assert.equal(chooseSpecies(760,land,rng,"predator"),null);
 assert.equal(chooseSpecies(760,land,rng,"bird"),null);
 assert.equal(chooseSpecies(760,land,rng,"human"),null);
 assert.equal(chooseSpecies(870,land,rng,"grazer"),null);
});
test("Mesozoic dinosaurs and pterosaurs end at the extinction milestone",()=>{
 const mid=Object.entries(SPECIES).filter(([id,s])=>permitted(s,1080,land));
 assert.ok(mid.some(([id])=>id==="sauropod"));
 assert.ok(mid.some(([id])=>id==="stegosaur"));
 assert.ok(mid.some(([id])=>id==="theropod"));
 assert.ok(mid.some(([id])=>id==="pterosaur"));
 for(const id of ["sauropod","theropod","stegosaur","pterosaur"])
   assert.equal(permitted(SPECIES[id],1150,land),false);
});
test("Animal species are constrained by climate, substrate and broad epoch",()=>{
 assert.equal(permitted(SPECIES.earlyFish,1540,land),false);
 assert.equal(permitted(SPECIES.earlyFish,1540,sea),true);
 assert.equal(permitted(SPECIES.elephant,1540,{...land,temperature:1}),false);
 assert.equal(permitted(SPECIES.mammoth,1540,land),false);
 assert.equal(permitted(SPECIES.human,1250,land),true);
 assert.equal(permitted(SPECIES.human,1010,land),false);
});
test("Early plants do not grow flowering trees or late-period grasses",()=>{
 const landWet={...land,river:true};
 assert.equal(choosePlant(870,landWet,rng,true),null);
 assert.ok(["algalMat","earlyMoss"].includes(choosePlant(870,landWet,rng,false)));
 assert.equal(permitted(PLANTS.oak,1010,land),false);
 assert.equal(permitted(PLANTS.cycad,1050,land),true);
});
test("Human clothing is time-sensitive and climate-aware",()=>{
 assert.equal(humanStyle(1010,land),null);
 assert.equal(humanStyle(1250,land).outfit,"minimal-wrap");
 assert.equal(humanStyle(1320,{...land,temperature:2}).outfit,"fur-tunic");
 assert.equal(humanStyle(1320,land).outfit,"woven-tunic");
 assert.equal(humanStyle(1500,land).outfit,"coat-and-trousers");
 assert.equal(humanStyle(1550,land).period,"contemporary");
 assert.equal(humanStyle(1600,land).period,"speculative");
});
test("Marine creatures navigate water and carry individual species identity",()=>{
 const w=new SurfaceWorld(42,800,5,0);
 assert.ok(w.counts.marine>0);
 assert.equal(w.counts.grazer,0);
 assert.equal(w.counts.human,0);
 assert.ok(w.agents.filter(a=>a.type==="marine").every(a=>!w.isLand(a.x,a.z)));
 for(let i=0;i<1100;i++)w.update(.05);
 assert.ok(w.agents.some(a=>a.type==="marine"&&a.species==="trilobite"));
 assert.ok(w.agents.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.rotation)));
});
test("Physical geography offers a broad feature taxonomy and stable samples",()=>{
 assert.ok(LANDFORMS.length>=25);
 assert.ok(WATERS.length>=15);
 const sample=sampleGeography(-20,-55,42);
 const a=classifyPhysicalFeature(sample);
 const b=detailedPhysicalFeature(sample,(dx,dz)=>sampleGeography(-20+dz*.018,-55+dx*.018,42));
 assert.ok(["land","water"].includes(a.category));
 assert.ok(["land","water"].includes(b.category));
 assert.equal(classifyPhysicalFeature(sample).name,a.name);
});
test("Terrain and weather survive save/load without changing animal species",()=>{
 const w=new SurfaceWorld(42,1540,-20,-55);
 w.weather="rain";w.weatherIntensity=.7;w.wind=.3;
 const stored=SurfaceWorld.fromJSON(JSON.parse(JSON.stringify(w.toJSON())));
 assert.equal(stored.weather,"rain");
 assert.equal(stored.weatherIntensity,.7);
 assert.deepEqual(stored.agents.map(a=>a.species),w.agents.map(a=>a.species));
});
