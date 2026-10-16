import test from "node:test";
import assert from "node:assert/strict";
import {SPECIES,permitted} from "../src/era-ecology.js";
import {LAND_FORMS} from "../src/animal-families.js";
import {
 findScenicLocation,sampleLocal,sampleGeography,globeReliefRadius,
 globeUVToGeo,localToGeo
} from "../src/geography.js";
import {SurfaceWorld} from "../src/surface-world.js";

const DINOSAURS=new Set([
 "sauropod","stegosaur","theropod","triceratops",
 "ankylosaur","hadrosaur","spinosaurus"
]);
test("every land animal has a dedicated anatomical family or dinosaur builder",()=>{
 const terrestrial=Object.entries(SPECIES).filter(([_,s])=>
   ["grazer","predator"].includes(s.guild));
 assert.ok(terrestrial.length>=35);
 for(const [id] of terrestrial)
   assert.ok(LAND_FORMS[id]||DINOSAURS.has(id),"missing anatomy for "+id);
 assert.notEqual(LAND_FORMS.wolf,LAND_FORMS.lion);
 assert.notEqual(LAND_FORMS.deer,LAND_FORMS.bison);
 assert.notEqual(LAND_FORMS.elephant,LAND_FORMS.rabbit);
 assert.notEqual(LAND_FORMS.horse,LAND_FORMS.crocodile);
 assert.notEqual(LAND_FORMS.giraffe,LAND_FORMS.rhinoceros);
 assert.notEqual(LAND_FORMS.gorilla,LAND_FORMS.snake);
});

test("expanded species catalogue has broad marine, avian and terrestrial families",()=>{
 assert.ok(Object.keys(SPECIES).length>=60);
 for(const guild of ["grazer","predator","bird","marine","human"])
   assert.ok(Object.values(SPECIES).some(s=>s.guild===guild));
 for(const id of ["shark","stingray","dolphin","whale","seaTurtle",
  "crocodile","triceratops","ankylosaur","fox","bear","giraffe",
  "camel","hippopotamus","horse","gorilla","penguin","parrot","butterfly"])
   assert.ok(SPECIES[id],id+" missing");
});

test("mountain scouting finds prominent physical relief, not labels or rock props",()=>{
 const target=findScenicLocation("mountain",42);
 assert.ok(target);
 const origin=sampleGeography(target.lat,target.lon,42);
 assert.ok(origin.land&&origin.height>14);
 let min=Infinity,max=-Infinity;
 for(let x=-90;x<=90;x+=12)
   for(let z=-90;z<=90;z+=12){
     const p=sampleLocal(x,z,target.lat,target.lon,42);
     min=Math.min(min,p.height);max=Math.max(max,p.height);
   }
 assert.ok(max-min>10,"scouted region should have visually prominent terrain relief");
 const expected=globeReliefRadius(origin);
 assert.ok(expected>2.35);
 assert.ok(expected<2.47);
});

test("scouted coast, river and inland lake use canonical, matching physical water",()=>{
 const coast=findScenicLocation("coast",42),river=findScenicLocation("river",42),
   lake=findScenicLocation("lake",42),island=findScenicLocation("island",42);
 assert.ok(coast&&river&&lake&&island);
 assert.equal(sampleGeography(coast.lat,coast.lon,42).land,true);
 assert.equal(sampleGeography(river.lat,river.lon,42).river,true);
 assert.equal(sampleGeography(lake.lat,lake.lon,42).waterKind,"lake");
 assert.equal(sampleGeography(island.lat,island.lon,42).land,true);
 for(const target of [coast,river,lake,island]){
   const globe=sampleGeography(target.lat,target.lon,42);
   const local=sampleLocal(0,0,target.lat,target.lon,42);
   assert.deepEqual(local,globe);
 }
});
test("scenic search is seeded and stable across identical runs",()=>{
 for(const kind of ["mountain","coast","lake","river","island","forest","desert"])
   assert.deepEqual(findScenicLocation(kind,42),findScenicLocation(kind,42));
 assert.throws(()=>findScenicLocation("secret bunker",42),/Unknown/);
});
test("extended animals respect their earliest and latest supported model milestones",()=>{
 const warm={land:true,temperature:25,moisture:.58,coastal:false,
   river:false,waterKind:null,height:4,biome:"grassland"};
 const sea={...warm,land:false,waterKind:"ocean"};
 assert.equal(permitted(SPECIES.triceratops,1000,warm),false);
 assert.equal(permitted(SPECIES.triceratops,1110,warm),true);
 assert.equal(permitted(SPECIES.triceratops,1160,warm),false);
 assert.equal(permitted(SPECIES.wolf,1110,warm),false);
 assert.equal(permitted(SPECIES.wolf,1540,warm),true);
 assert.equal(permitted(SPECIES.human,1600,warm),true);
 assert.equal(permitted(SPECIES.wolf,1600,warm),true);
 assert.equal(permitted(SPECIES.shark,1540,warm),false);
 assert.equal(permitted(SPECIES.shark,1540,sea),true);
});
test("local world spawns different anatomically identified species",()=>{
 const site=findScenicLocation("forest",42);
 const w=new SurfaceWorld(42,1540,site.lat,site.lon);
 const names=new Set(w.agents.map(a=>a.species));
 assert.ok(names.size>=3,"visible local ecosystem should contain multiple species");
 for(const a of w.agents){
   assert.ok(SPECIES[a.species]);
   assert.ok(a.size>0&&Number.isFinite(a.rotation));
 }
});
