import test from "node:test";
import assert from "node:assert/strict";
import {SurfaceWorld} from "../src/surface-world.js";
import {sampleLocal,sampleGeography,localToGeo,globeUVToGeo} from "../src/geography.js";
import {OpenWorldStreamer} from "../src/open-world.js";
const landWorld=(seed=42,era=1540)=>new SurfaceWorld(seed,era,-20,-55);

test("the canonical global generator contains mountains, oceans and lowlands",()=>{
  const seed=42, samples=[];
  for(let lat=-75;lat<=75;lat+=5)
    for(let lon=-180;lon<180;lon+=5)
      samples.push(sampleGeography(lat,lon,seed));
  assert.ok(samples.some(s=>s.height>8),"mountains are represented");
  assert.ok(samples.some(s=>s.height<0),"oceans are represented");
  assert.ok(samples.some(s=>s.land&&s.height>0&&s.height<3),"lowlands are represented");
});
test("historical gates keep humans and birds absent in early history",()=>{
  const old=landWorld(42,400);
  const recent=landWorld(42,1540);
  assert.equal(old.counts.human,0);assert.equal(old.counts.bird,0);
  assert.ok(recent.counts.human>0);assert.ok(recent.counts.bird>0);
});
test("animals forage, prey are hunted and humans autonomously build",()=>{
  const w=landWorld(42,1540);
  const shelters=w.structures.length;
  for(let i=0;i<2500;i++)w.update(.05);
  assert.ok(w.events.some(e=>e.message.includes("hunted")),"predators have hunted");
  assert.ok(w.structures.length>shelters,"people constructed shelters autonomously");
  assert.ok(w.agents.some(a=>a.type==="human"&&a.goal!=="exploring"));
});
test("god actions affect actual world state",()=>{
  const w=landWorld(20,1540);
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
  const a=landWorld(9,1490),b=new SurfaceWorld(9,1490,-10,110);
  for(let i=0;i<800;i++){a.update(.05);b.update(.05)}
  assert.deepEqual(a.counts,b.counts);
  assert.deepEqual(a.events,b.events);
  assert.deepEqual(a.structures,b.structures);
});
test("agents remain within the playable territory",()=>{
  const w=landWorld(26,1540);
  for(let i=0;i<2000;i++)w.update(.05);
  for(const a of w.agents){
    assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.z));
    assert.ok(Number.isFinite(a.hunger));assert.ok(Number.isFinite(a.health));
  }
});

test("save and reload preserves local creatures, buildings, skills and god actions",()=>{
  const w=landWorld(18,1540);
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
  const w=landWorld(42,1490);
  const data=w.toJSON();data.trees=Array(850).fill({});
  assert.throws(()=>SurfaceWorld.fromJSON(data));
});

test("multiple vegetation types and ground cover are biome-driven",()=>{
  const ancient=landWorld(42,870);
  assert.ok(ancient.trees.length>=100);
  assert.ok(ancient.trees.every(t=>["pine","cedar"].includes(t.species)));
  assert.ok(ancient.undergrowth.every(p=>["reed","fern"].includes(p.species)));
  const modern=landWorld(42,1540);
  assert.ok(new Set(modern.trees.map(t=>t.species)).size>=3);
  assert.ok(new Set(modern.undergrowth.map(p=>p.species)).size>=4);
  assert.ok(modern.undergrowth.length>500);
  assert.deepEqual(SurfaceWorld.fromJSON(modern.toJSON()).undergrowth,modern.undergrowth);
});

test("the same geographic point underpins both globe and ground elevation",()=>{
  const w=landWorld(42,1540);
  for(const [x,z] of [[0,0],[48,0],[-79,66],[415,-130],[-400,200]]){
    const geo=localToGeo(x,z,w.lat,w.lon);
    const fromGlobe=sampleGeography(geo.lat,geo.lon,w.seed,w.seaShift);
    const fromGround=sampleLocal(x,z,w.lat,w.lon,w.seed,w.seaShift);
    assert.equal(fromGround.elevation,fromGlobe.elevation);
    assert.equal(w.height(x,z),fromGlobe.height);
    assert.equal(w.isLand(x,z),fromGlobe.land);
    assert.equal(fromGround.biome,fromGlobe.biome);
  }
  assert.equal(globeUVToGeo(.25,.5).lon,0);
  assert.equal(globeUVToGeo(.5,.25).lat,45);
});
test("streamed open-world cells preserve exploration and fauna on return",()=>{
  const w=landWorld(42,1540),stream=new OpenWorldStreamer(w);
  assert.equal(stream.update(0,0),true);
  assert.equal(w.streamLoaded.size,25);
  const startTrees=w.trees.length,startAgents=w.agents.length;
  assert.ok(w.exploredChunks.has("0,0"));
  stream.update(400,0);
  assert.ok(w.streamLoaded.size<=25);
  assert.ok(w.streamCache.size>0);
  stream.update(0,0);
  assert.equal(w.trees.length,startTrees);
  assert.equal(w.agents.length,startAgents);
  const restored=SurfaceWorld.fromJSON(JSON.parse(JSON.stringify(w.toJSON())));
  assert.deepEqual(restored.exploredChunks,w.exploredChunks);
  assert.deepEqual(restored.streamLoaded,w.streamLoaded);
  assert.equal(restored.streamCache.size,w.streamCache.size);
});
test("ocean focus does not invent land or wildlife",()=>{
  const ocean=new SurfaceWorld(42,1540,5,0);
  const g=sampleGeography(5,0,42);
  assert.equal(g.land,false);
  assert.equal(ocean.isLand(0,0),false);
  assert.equal(ocean.spawn("human",0,0),null);
});
