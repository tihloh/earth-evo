// Bounded, reproducible open-world ecology streaming around the camera.
// Only nearby chunks receive individual flora/fauna simulation. Distant chunks are
// serialized as lightweight snapshots, or reconstructed from the same world seed.
import {RNG} from "./simulation.js";
import {STREAM_CHUNK_SIZE} from "./geography.js";

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
    if(world.era<870)return;
    for(let i=0;i<11;i++){
      const x=(cx+rng.next())*size,z=(cz+rng.next())*size;
      const s=world.sample(x,z);if(!s.land)continue;
      const r=rng.next();
      const species=world.era<1010?(r<.65?"pine":"cedar"):
        s.river?(r<.5?"willow":"mangrove"):s.height>6?"pine":
        s.moisture<.34?"acacia":r<.28?"oak":r<.52?"birch":
        r<.67?"palm":r<.84?"pine":"cedar";
      world.trees.push({id:world.nextId++,x,z,species,
        size:.7+rng.next()*.95,fruit:1+rng.next()*4,
        wood:1+rng.next()*2,alive:true});
    }
    for(let i=0;i<27;i++){
      const x=(cx+rng.next())*size,z=(cz+rng.next())*size;
      const s=world.sample(x,z);
      if(!s.land||s.height>12)continue;
      const roll=rng.next();
      const species=world.era<1010?(roll<.7?"fern":"reed"):
        s.river?"reed":s.height>5?"fern":roll<.27?"grass":
        roll<.53?"bush":roll<.71?"flower":"heather";
      world.undergrowth.push({x,z,species,size:.5+rng.next()*.9,
        angle:rng.next()*Math.PI*2});
    }
    if(world.era>=760&&world.agents.length<125&&rng.next()<.63){
      const x=(cx+rng.next())*size,z=(cz+rng.next())*size;
      if(world.isLand(x,z)){
        const choice=rng.next();
        const type=world.era>=1010&&choice<.22?"bird":choice<.75?"grazer":"predator";
        world.spawn(type,x,z);
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