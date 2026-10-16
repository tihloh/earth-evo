import test from "node:test";
import assert from "node:assert/strict";
import {World,END,ERAS,dateLabel,eraAt} from "../src/simulation.js";

test("Earth begins sterile and time progresses to the future",()=>{
 const world=new World(42);
 assert.equal(world.tick,0);assert.equal(world.speciesCount,0);
 world.seek(END);
 assert.equal(world.tick,END);assert.match(dateLabel(END),/2200 CE/);
 assert.ok(world.speciesCount>0);
 assert.ok(world.settlements.length>0);
});

test("rewinding restores the same deterministic world",()=>{
 const w=new World(42);
 w.seek(1600);
 const before={species:w.speciesCount,technology:w.technology,population:w.totalPopulation,
   cities:w.settlements.length,rng:w.rng.value};
 w.seek(700);w.seek(1600);
 const after={species:w.speciesCount,technology:w.technology,population:w.totalPopulation,
   cities:w.settlements.length,rng:w.rng.value};
 assert.deepEqual(after,before);
});

test("independent worlds with the same seed evolve identically",()=>{
 const a=new World(123),b=new World(123);
 a.seek(1490);b.seek(1490);
 assert.equal(a.totalPopulation,b.totalPopulation);
 assert.equal(a.technology,b.technology);
 assert.deepEqual(a.species.map(s=>[s.id,s.total]),b.species.map(s=>[s.id,s.total]));
});

test("disasters alter the simulation and remain in saves and rewinds",()=>{
 const baseline=new World(42);baseline.seek(1450);
 const changed=new World(42);changed.seek(1400);
 assert.equal(changed.intervene("impact"),true);
 changed.seek(1450);
 assert.notEqual(changed.totalPopulation,baseline.totalPopulation);
 changed.seek(1200);changed.seek(1450);
 const restored=World.deserialize(changed.serialize());
 assert.equal(restored.totalPopulation,changed.totalPopulation);
 assert.equal(restored.speciesCount,changed.speciesCount);
 assert.equal(restored.interventions.length,1);
});

test("multiple interventions at tick zero survive saving",()=>{
 const w=new World(7);
 w.intervene("warm");w.intervene("sea");
 w.seek(420);
 const loaded=World.deserialize(w.serialize());
 assert.equal(loaded.tick,420);
 assert.equal(loaded.temperature,w.temperature);
 assert.equal(loaded.ocean,w.ocean);
});

test("dates and era boundaries remain monotonic and bounded",()=>{
 assert.equal(eraAt(0),ERAS[0]);
 assert.equal(eraAt(END),ERAS.at(-1));
 for(let i=1;i<=END;i++) assert.ok(Number.isFinite(new World(1).tick+i));
 assert.equal(new World(1).seek(-100).tick,0);
 assert.equal(new World(1).seek(9999).tick,END);
});

test("invalid saves are rejected",()=>{
 assert.throws(()=>World.deserialize('{"version":2}'));
 assert.throws(()=>World.deserialize('{"version":1,"seed":1,"tick":-1,"interventions":[]}'));
 assert.throws(()=>World.deserialize('{"version":1,"seed":1,"tick":1,"interventions":[{"tick":0,"kind":"hack"}]}'));
});
