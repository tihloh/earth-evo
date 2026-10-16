import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
const view=readFileSync(new URL("../src/surface-view.js",import.meta.url),"utf8");
const globe=readFileSync(new URL("../src/renderer.js",import.meta.url),"utf8");

test("landscape finder, animal selector and close-up controls are present",()=>{
 for(const id of ["landscapePicker","visitLandscape","speciesPicker",
   "summonSpecies","zoomCreature","surfaceViewport","creatureInspector"])
   assert.match(page,new RegExp('id="'+id+'"'),id);
 assert.match(app,/findScenicLocation\(kind,world\.seed,world\.seaShift\)/);
 assert.match(app,/function refreshSpeciesPicker\(/);
 assert.match(app,/localView\.followAgentId=a\.id/);
});

test("clicked planet uses a real mesh reference and matching relief",()=>{
 assert.match(app,/ray\.intersectObject\(view\.planet\)/);
 assert.doesNotMatch(app,/ray\.intersectObject\(view\.earth\)/);
 assert.match(globe,/this\.planet=new THREE\.Mesh\(this\.planetGeometry,/);
 assert.match(globe,/globeReliefRadius\(s\)/);
});
test("surface scene uses instantiated near and lightweight far animals",()=>{
 assert.match(view,/nearAgentLimit=70/);
 assert.match(view,/new THREE\.InstancedMesh\(/);
 assert.match(view,/if\(this\.action==="species"\)/);
 assert.match(view,/SPECIES\[this\.selectedSpecies\]/);
});
