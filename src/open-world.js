// Bounded, reproducible open-world ecology streaming around the camera.
// Only nearby chunks receive individual flora/fauna simulation. Distant chunks are
// serialized as lightweight snapshots, or reconstructed from the same world seed.
import {RNG} from "./simulation.js";
import {STREAM_CHUNK_SIZE} from "./geography.js";
import {chooseSpecies,choosePlant} from "./era-ecology.js";

export class OpenWorldStreamer {
  constructor(world){
    this.world=world;
    world.streamLoaded ||= new Set();
    world.streamCache ||= new Map();
    world.exploredChunks ||= new Set();
  }
  static key(x,z){return Math.floor(x/STREAM_CHUNK_SIZE)+","+Math.floor(z/STREAM_CHUNK_SIZE)}
  sampleChunk(cx,cz){
    const world=this.world,size=STREAM_CHUNK_SIZE;
    const seed=(Math.imul(cx,73856093)^Math.imul(cz,19349663)^world.seed^0x42f77)>>>0;
    const rng=new RNG(seed||1);
    if(world.era<760)return;
    if(world.era>=890){
      for(let i=0;i<11;i++){
        const x=(cx+rng.next())*size,z=(cz+rng.next())*size;
        const s=world.sample(x,z);
        if(!s.land)continue;
        const species=choosePlant(world.era,s,rng,true);
        if(!species)continue;
        world.trees.push({id:world.nextId++,x,z,species,
          size:.7+rng.next()*.95,fruit:1+rng.next()*4,
          wood:1+rng.next()*2,alive:true});
      }
      for(let i=0;i<27;i++){
        const x=(cx+rng.next())*size,z=(cz+rng.next())*size;
        const s=world.sample(x,z);
        if(!s.land||s.height>12)continue;
        const selected=choosePlant(world.era,s,rng,false);
        const later=["grass","fern","reed","flower","bush","heather","scrub"];
        const species=world.era>=1120?(s.river?"reed":
          later[Math.floor(rng.next()*later.length)]):
          selected||"earlyMoss";
        world.undergrowth.push({x,z,species,size:.5+rng.next()*.9,
          angle:rng.next()*Math.PI*2});
      }
    }
    if(world.agents.length<140&&rng.next()<.70){
      const x=(cx+rng.next())*size,z=(cz+rng.next())*size;
      const g=world.sample(x,z);
      const guilds=g.land?["grazer","predator","bird"]:["marine"];
      const possible=guilds.filter(type=>chooseSpecies(world.era,g,{next:()=>.45},type));
      if(possible.length){
        const type=possible[Math.floor(rng.next()*possible.length)];
        const species=chooseSpecies(world.era,g,rng,type);
        if(species)world.spawn(type,x,z,species);
      }
    }
  }
  update(x,z){
    const world=this.world, cx=Math.floor(x/STREAM_CHUNK_SIZE),
      cz=Math.floor(z/STREAM_CHUNK_SIZE);
    const active=new Set();let changed=false;
    for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){
      const xx=cx+dx,zz=cz+dz,key=xx+","+zz;
      active.add(key);world.exploredChunks.add(key);
      if(world.streamLoaded.has(key))continue;
      const snapshot=world.streamCache.get(key);
      if(snapshot){
        world.trees.push(...snapshot.trees);
        world.undergrowth.push(...snapshot.cover);
        world.agents.push(...snapshot.agents);
        world.structures.push(...snapshot.structures);
        world.streamCache.delete(key);
      }else this.sampleChunk(xx,zz);
      world.streamLoaded.add(key);changed=true;
    }
    const size=STREAM_CHUNK_SIZE;
    for(const key of [...world.streamLoaded]){
      if(active.has(key))continue;
      const matches=p=>OpenWorldStreamer.key(p.x,p.z)===key;
      world.streamCache.set(key,{trees:world.trees.filter(matches),
        cover:world.undergrowth.filter(matches),
        agents:world.agents.filter(matches),
        structures:world.structures.filter(matches)});
      world.trees=world.trees.filter(p=>!matches(p));
      world.undergrowth=world.undergrowth.filter(p=>!matches(p));
      world.agents=world.agents.filter(p=>!matches(p));
      world.structures=world.structures.filter(p=>!matches(p));
      world.streamLoaded.delete(key);changed=true;
    }
    while(world.streamCache.size>96){
      world.streamCache.delete(world.streamCache.keys().next().value);
    }
    return changed;
  }
  isExplored(cx,cz){
    return this.world.exploredChunks.has(cx+","+cz);
  }
}