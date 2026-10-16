import test from "node:test";
import assert from "node:assert/strict";
import {SurfaceWorld,terrainHeight,riverX} from "../src/surface-world.js";

test("terrain includes mountains, lowlands and a river corridor",()=>{
  const seed=42;const samples=[];
  for(let z=-80;z<80;z+=10)for(let x=-80;x<80;x+=10)
    samples.push(terrainHeight(x,z,seed));
  assert.ok(Math.max(...samples)>8,"mountain peaks present");
  assert.ok(Math.min(...samples)<-2,"low coastline / island inlets present");
  assert.ok(Number.isFinite(riverX(40,seed)));
});
test("historical gates keep humans and birds absent in early history",()=>{
  const old=new SurfaceWorld(42,400);
  const recent=new SurfaceWorld(42,1540);
  assert.equal(old.counts.human,0);assert.equal(old.counts.bird,0);
  assert.ok(recent.counts.human>0);assert.ok(recent.counts.bird>0);
});
test("animals forage, prey are hunted and humans autonomously build",()=>{
  const w=new SurfaceWorld(42,1540,5,0);
  const shelters=w.structures.length;
  for(let i=0;i<2500;i++)w.update(.05);
  assert.ok(w.events.some(e=>e.message.includes("hunted")),"predators have hunted");
  assert.ok(w.structures.length>shelters,"people constructed shelters autonomously");
  assert.ok(w.agents.some(a=>a.type==="human"&&a.goal!=="exploring"));
});
test("god actions affect actual world state",()=>{
  const w=new SurfaceWorld(20,1540);
  const before=w.trees.length;
  w.intervene("tree",0,0);
  assert.ok(w.trees.length>=before);
  w.intervene("rain",0,0);assert.ok(w.rain>0);
  const count=w.counts.grazer;
  let point=w.location({x:10,z:10},30);
  w.intervene("grazer",point.x,point.z);
  assert.equal(w.counts.grazer,count+1);
  w.intervene("hut",point.x,point.z);
  assert.ok(w.structures.length>2);
});
test("local worlds are deterministic for the same seed and location",()=>{
  const a=new SurfaceWorld(9,1490,-10,110),b=new SurfaceWorld(9,1490,-10,110);
  for(let i=0;i<800;i++){a.update(.05);b.update(.05)}
  assert.deepEqual(a.counts,b.counts);
  assert.deepEqual(a.events,b.events);
  assert.deepEqual(a.structures,b.structures);
});
test("agents remain within the playable territory",()=>{
  const w=new SurfaceWorld(26,1540);
  for(let i=0;i<2000;i++)w.update(.05);
  for(const a of w.agents){
    assert.ok(a.x>=-86&&a.x<=86);assert.ok(a.z>=-86&&a.z<=86);
    assert.ok(Number.isFinite(a.hunger));assert.ok(Number.isFinite(a.health));
  }
});

test("save and reload preserves local creatures, buildings, skills and god actions",()=>{
  const w=new SurfaceWorld(18,1540,6,9);
  for(let i=0;i<400;i++)w.update(.05);
  const p=w.location({x:0,z:0},15);
  w.intervene("tree",p.x,p.z);w.intervene("rain",p.x,p.z);
  const loaded=SurfaceWorld.fromJSON(JSON.parse(JSON.stringify(w.toJSON())));
  assert.deepEqual(loaded.counts,w.counts);
  assert.deepEqual(loaded.structures,w.structures);
  assert.deepEqual(loaded.trees,w.trees);
  assert.equal(loaded.time,w.time);
  assert.equal(loaded.rain,w.rain);
  for(let i=0;i<80;i++){w.update(.05);loaded.update(.05)}
  assert.deepEqual(loaded.counts,w.counts);
  assert.deepEqual(loaded.events,w.events);
});
test("invalid regional save data cannot create massive worlds",()=>{
  const w=new SurfaceWorld(42,1490);
  const data=w.toJSON();data.trees=Array(650).fill({});
  assert.throws(()=>SurfaceWorld.fromJSON(data));
});

test("multiple vegetation types and ground cover are biome-driven",()=>{
  const ancient=new SurfaceWorld(42,870,8,0);
  assert.ok(ancient.trees.length>=100);
  assert.ok(ancient.trees.every(t=>["pine","cedar"].includes(t.species)));
  assert.ok(ancient.undergrowth.every(p=>["reed","fern"].includes(p.species)));
  const modern=new SurfaceWorld(42,1540,8,0);
  assert.ok(new Set(modern.trees.map(t=>t.species)).size>=6);
  assert.ok(new Set(modern.undergrowth.map(p=>p.species)).size>=6);
  assert.ok(modern.undergrowth.length>500);
  assert.deepEqual(SurfaceWorld.fromJSON(modern.toJSON()).undergrowth,modern.undergrowth);
});
