// Lightweight regional autonomous-agent ecology. This is a goal/need-based AI simulation,
// not a conscious mind or a historical reconstruction. No Three.js dependency.
import {RNG} from "./simulation.js";
import {sampleLocal} from "./geography.js";

export const REGION_SIZE = 180;
// Initial spawn extent only; terrain itself is streamed without a square boundary.
const CLAMP=(v,a,b)=>Math.max(a,Math.min(b,v));
const TYPES=["human","grazer","predator","bird"];
function dist(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
export class SurfaceWorld {
  constructor(seed=42,era=1490,lat=5,lon=0,seaShift=0){
    this.seed=(seed>>>0)||42;this.era=era;this.lat=lat;this.lon=lon;this.seaShift=seaShift;
    this.terrainSeed=(this.seed+Math.round(lat*37)+Math.round(lon*19))>>>0;
    this.rng=new RNG(this.terrainSeed||7);
    this.time=0;this.elapsed=0;this.nextId=1;this.agents=[];this.trees=[];this.undergrowth=[];
    this.structures=[];this.events=[];this.rain=0;this.fertility=1;
    this.village={x:-12,z:-14,wood:0,food:14};
    this.lastBirth=0;this.lastSeed=0;
    this.populate();
  }
  sample(x,z){return sampleLocal(x,z,this.lat,this.lon,this.seed,this.seaShift)}
  height(x,z){return this.sample(x,z).height}
  isLand(x,z){return this.sample(x,z).land}
  location(prefer={x:0,z:0},range=65){
    for(let t=0;t<100;t++){
      const x=CLAMP(prefer.x+this.rng.between(-range,range),-10000,10000);
      const z=CLAMP(prefer.z+this.rng.between(-range,range),-10000,10000);
      if(this.isLand(x,z)&&this.height(x,z)<9)return {x,z};
    }
    return {x:0,z:0};
  }
  log(message){this.events.unshift({time:Math.floor(this.time),message});if(this.events.length>25)this.events.length=25}
  vegetationBiome(x,z){
    const g=this.sample(x,z);
    return {height:g.height,shore:g.river?0:g.height<2?6:30,moisture:g.moisture};
  }
  chooseTreeSpecies(x,z){
    const biome=this.vegetationBiome(x,z);
    // Avoid modern-looking broadleaf forests before their rough historical appearance.
    if(this.era<1010)return this.rng.next()<.7?"cedar":"pine";
    const roll=this.rng.next();
    if(biome.shore<10&&biome.height<3)return roll<.63?"willow":"mangrove";
    if(biome.height>5)return roll<.8?"pine":"cedar";
    if(biome.moisture<.38)return roll<.65?"acacia":"palm";
    if(Math.abs(this.lat)<23&&biome.height<2.5&&roll<.28)return "palm";
    return roll<.49?"oak":roll<.72?"birch":roll<.87?"pine":"cedar";
  }
  spawnTree(x,z){
    if(!this.isLand(x,z)||this.trees.length>=600)return null;
    const species=this.chooseTreeSpecies(x,z);
    const t={id:this.nextId++,x,z,species,
      size:this.rng.between(.75,1.6),fruit:this.rng.between(1,5),
      wood:this.rng.between(1,3),alive:true};
    this.trees.push(t);return t;
  }
  growGroundCover(count=650){
    if(this.era<870)return;
    for(let i=0;i<count&&this.undergrowth.length<1200;i++){
      const x=this.rng.between(-87,87),z=this.rng.between(-87,87);
      if(!this.isLand(x,z)||this.height(x,z)>12)continue;
      const b=this.vegetationBiome(x,z),roll=this.rng.next();
      let species;
      if(this.era<1010)species=b.shore<9?"reed":"fern";
      else if(b.shore<9)species=roll<.68?"reed":"fern";
      else if(b.height>4)species=roll<.63?"fern":"heather";
      else if(b.moisture<.3)species=roll<.7?"scrub":"grass";
      else species=roll<.35?"grass":roll<.61?"flower":roll<.85?"bush":"fern";
      this.undergrowth.push({x,z,species,size:this.rng.between(.55,1.3),angle:this.rng.between(0,Math.PI*2)});
    }
  }
  spawn(type,x,z){
    if(!TYPES.includes(type)||!this.isLand(x,z)||this.agents.length>=190)return null;
    if(type==="human"&&this.era<1250)return null;
    if(type==="bird"&&this.era<1010)return null;
    const a={id:this.nextId++,type,x,z,rotation:this.rng.between(0,Math.PI*2),
      hunger:this.rng.between(0,35),energy:this.rng.between(40,100),health:100,
      age:0,goal:"exploring",reason:"Curious about the surroundings",
      personality:{curiosity:this.rng.between(0,1),courage:this.rng.between(0,1),
        sociability:this.rng.between(0,1),diligence:this.rng.between(0,1)},
      memory:{lastFood:null,lastDanger:null},skill:{survival:0,craft:0},
      target:null,decision:0,carried:0,food:0,active:true,altitude:0};
    this.agents.push(a);return a;
  }
  populate(){
    this.village=this.location({x:-12,z:-14},25);this.village.wood=0;this.village.food=14;
    const trees=this.era>=870?280:0;
    for(let i=0;i<trees;i++){const p=this.location({x:0,z:0},85);this.spawnTree(p.x,p.z)}
    this.growGroundCover(950);
    if(this.era>=760){
      for(let i=0;i<35;i++){const p=this.location({x:-15,z:8},60);this.spawn("grazer",p.x,p.z)}
      for(let i=0;i<9;i++){const p=this.location({x:18,z:-9},70);this.spawn("predator",p.x,p.z)}
    }
    if(this.era>=1010)for(let i=0;i<16;i++){const p=this.location();this.spawn("bird",p.x,p.z)}
    if(this.era>=1250){
      let humans=this.era>=1310?14:6;
      for(let i=0;i<humans;i++){const p=this.location(this.village,22);this.spawn("human",p.x,p.z)}
    }
    if(this.era>=1310){
      this.village.wood=9;
      for(let i=0;i<2;i++){
        const p=this.location(this.village,8);
        this.structures.push({id:this.nextId++,x:p.x,z:p.z,progress:1,type:"hut"});
      }
    }
    this.log("The region begins its autonomous life");
  }
  nearest(a,type,condition=()=>true,max=1000){
    let found=null,best=max;
    const list=type==="tree"?this.trees:this.agents;
    for(const b of list){
      if(b===a||(type==="tree"?!b.alive:b.type!==type||!b.active)||!condition(b))continue;
      const d=dist(a,b);if(d<best){best=d;found=b}
    }
    return found;
  }
  destination(a,p,goal){
    a.target={x:p.x,z:p.z,id:p.id??null};a.goal=goal;
    a.reason=({
      fleeing:"A nearby predator is dangerous",
      "escaping danger":"Survival is more important than other goals",
      foraging:"Hunger motivates finding ripe fruit",
      "collecting food":"Gathering food to satisfy hunger",
      hunting:"Tracking nearby prey to survive",
      grazing:"Seeking grass and safe feeding grounds",
      "gathering timber":"Collecting materials for shelters",
      "delivering timber":"Returning collected wood to the community",
      "building shelter":"Enough shared material is available to construct shelter",
      socializing:"Companionship and cooperative relationships matter",
      flying:"Searching for food and navigating the sky",
      patrolling:"Searching the surroundings for prey",
      wandering:"Exploring the surrounding territory",
      exploring:"Curiosity drives the search for new territory"
    })[goal]||"Exploring the environment";
  }
  randomDestination(a,goal="wandering"){
    this.destination(a,this.location({x:a.x,z:a.z},24),goal);
  }
  decide(a){
    if(!a.active)return;
    if(a.type==="grazer"||a.type==="bird"){
      const predator=this.nearest(a,"predator",()=>true,a.type==="bird"?12:16+(1-a.personality.courage)*7);
      if(predator){
        a.memory.lastDanger={x:predator.x,z:predator.z,time:this.time};
        const dx=a.x-predator.x,dz=a.z-predator.z,d=Math.max(.01,Math.hypot(dx,dz));
        this.destination(a,{x:CLAMP(a.x+dx/d*27,-10000,10000),z:CLAMP(a.z+dz/d*27,-10000,10000)},"fleeing");
        return;
      }
      const remembered=a.memory.lastFood&&this.trees.find(t=>t.id===a.memory.lastFood&&t.alive&&t.fruit>.5);
      const tree=remembered&&dist(a,remembered)<35?remembered:
        this.nearest(a,"tree",t=>t.fruit>.5,30);
      if(a.hunger>38&&tree){this.destination(a,tree,"foraging");return}
      if(!a.target||this.rng.next()<.12)this.randomDestination(a,a.type==="bird"?"flying":"grazing");
      return;
    }
    if(a.type==="predator"){
      const prey=this.nearest(a,"grazer",()=>true,40+10*a.personality.courage);
      if(a.hunger>23&&prey){this.destination(a,prey,"hunting");return}
      if(!a.target||this.rng.next()<.1)this.randomDestination(a,"patrolling");
      return;
    }
    // Human goal-based behavior: danger > food > shelter materials > building > socializing.
    const threat=this.nearest(a,"predator",()=>true,12+(1-a.personality.courage)*8);
    if(threat){
      a.memory.lastDanger={x:threat.x,z:threat.z,time:this.time};
      const dx=a.x-threat.x,dz=a.z-threat.z,d=Math.max(.01,Math.hypot(dx,dz));
      this.destination(a,{x:CLAMP(a.x+dx/d*23,-10000,10000),z:CLAMP(a.z+dz/d*23,-10000,10000)},"escaping danger");
      return;
    }
    const known=a.memory.lastFood&&this.trees.find(t=>t.id===a.memory.lastFood&&t.alive&&t.fruit>.5);
    const tree=known&&dist(a,known)<55?known:this.nearest(a,"tree",t=>t.fruit>1||t.wood>0,56);
    if(a.hunger>37&&a.food<1&&a.personality.courage>.5&&
      this.rng.next()<.34){
      const prey=this.nearest(a,"grazer",()=>true,58);
      if(prey){this.destination(a,prey,"hunting");return}
    }
    if(a.hunger>42&&a.food<1&&tree&&tree.fruit>0){
      this.destination(a,tree,"collecting food");return;
    }
    if(a.hunger>40&&a.food>0){a.food--;a.hunger=CLAMP(a.hunger-50,0,100);a.goal="eating";return}
    if(this.era>=1310&&a.carried<2&&tree&&tree.wood>.3&&
      (a.personality.diligence>.22||this.village.wood<3)){
      this.destination(a,tree,"gathering timber");return;
    }
    if(a.carried>=2){this.destination(a,this.village,"delivering timber");return}
    if(this.era>=1310&&this.village.wood>=3&&this.structures.length<22){
      this.destination(a,this.village,"building shelter");return;
    }
    const other=this.nearest(a,"human",()=>true,35);
    if(other&&this.rng.next()<.1+.45*a.personality.sociability){
      this.destination(a,other,"socializing");return}
    if(!a.target||this.rng.next()<.16)this.randomDestination(a,"exploring");
  }
  move(a,dt){
    if(!a.target){this.decide(a);return}
    let x=a.target.x,z=a.target.z;
    const goalTarget=a.target.id?this.agents.find(v=>v.id===a.target.id&&v.active)||this.trees.find(v=>v.id===a.target.id&&v.alive):null;
    if(goalTarget){x=goalTarget.x;z=goalTarget.z}
    const dx=x-a.x,dz=z-a.z,d=Math.hypot(dx,dz);
    if(d>1.3){
      const speed=(a.type==="bird"?8.5:a.type==="predator"?5.1:a.type==="grazer"?4.1:2.4)*(a.goal==="fleeing"||a.goal==="escaping danger"?1.48:1);
      const step=Math.min(d,speed*dt);
      const nx=CLAMP(a.x+dx/d*step,-10000,10000),nz=CLAMP(a.z+dz/d*step,-10000,10000);
      if(this.isLand(nx,nz)||a.type==="bird"){
        a.x=nx;a.z=nz;a.rotation=Math.atan2(dx,dz);
      }else{a.target=null;a.decision=0}
      return;
    }
    this.onArrival(a,goalTarget);
    a.target=null;a.decision=0;
  }
  onArrival(a,target){
    if(a.goal==="hunting"&&target&&target.type==="grazer"&&target.active&&dist(a,target)<3){
      target.health=0;target.active=false;a.hunger=CLAMP(a.hunger-60,0,100);a.energy=CLAMP(a.energy+26,0,100);
      a.skill.survival=CLAMP(a.skill.survival+.12,0,10);
      if(a.type==="human")a.food+=2;
      this.log((a.type==="human"?"Human":"Predator")+" #"+a.id+" hunted grazer #"+target.id);return;
    }
    if((a.goal==="foraging"||a.goal==="collecting food")&&target?.fruit>0){
      const n=Math.min(target.fruit,a.type==="human"?2:1.5);target.fruit-=n;
      a.memory.lastFood=target.id;
      a.skill.survival=CLAMP(a.skill.survival+.025,0,10);
      if(a.type==="human"){a.food+=n;a.goal="eating";a.hunger=Math.max(0,a.hunger-26)}
      else a.hunger=Math.max(0,a.hunger-48);
      return;
    }
    if(a.goal==="gathering timber"&&target?.wood>0){
      const n=Math.min(2,target.wood);target.wood-=n;a.carried+=n;
      a.skill.craft=CLAMP(a.skill.craft+.06,0,10);
      if(target.wood<=0&&target.fruit<=0)target.alive=false;
      return;
    }
    if(a.goal==="delivering timber"){
      this.village.wood+=a.carried;a.carried=0;
      this.log("Human #"+a.id+" delivered wood");return;
    }
    if(a.goal==="building shelter"&&this.village.wood>=3){
      this.village.wood-=3;
      const angle=this.rng.next()*Math.PI*2;
      const radial=8+Math.sqrt(this.structures.length)*4;
      const px=CLAMP(this.village.x+Math.cos(angle)*radial,-10000,10000);
      const pz=CLAMP(this.village.z+Math.sin(angle)*radial,-10000,10000);
      if(this.isLand(px,pz)){
        this.structures.push({id:this.nextId++,x:px,z:pz,type:"hut",progress:1});
        a.skill.craft=CLAMP(a.skill.craft+.25,0,10);
        this.log("Human #"+a.id+" built a new shelter");
      }
      return;
    }
    if(a.goal==="socializing"){a.energy=Math.min(100,a.energy+6)}
  }
  update(dt){
    dt=CLAMP(dt,0,.12);
    this.elapsed+=dt;
    while(this.elapsed>=.05){
      this.advance(.05);this.elapsed-=.05;
    }
  }
  advance(dt){
    this.time+=dt;
    if(this.rain>0)this.rain=Math.max(0,this.rain-dt);
    for(const tree of this.trees)if(tree.alive){
      tree.fruit=CLAMP(tree.fruit+dt*(this.rain? .08:.022)*this.fertility,0,6);
    }
    for(const a of this.agents){
      if(!a.active)continue;
      a.age+=dt;a.hunger=CLAMP(a.hunger+dt*(a.type==="bird"?1.1:.7),0,110);
      a.energy=CLAMP(a.energy+dt*.6,0,100);
      if(a.hunger>97)a.health-=dt*3;
      if(a.health<=0){a.active=false;this.log(a.type+" #"+a.id+" died");continue}
      a.decision-=dt;
      if(a.decision<=0){
        this.decide(a);a.decision=.8+this.rng.between(0,.7);
      }
      this.move(a,dt);
      if(a.type==="bird")a.altitude=3+2*Math.sin(a.age*3+a.id);
      // Small autonomous population dynamics. Births depend on survival and resource access.
    }
    if(this.time-this.lastSeed>18&&this.trees.length<500&&this.era>=870){
      this.lastSeed=this.time;
      const parents=this.trees.filter(t=>t.alive&&t.fruit>3);
      if(parents.length){
        const parent=this.rng.pick(parents),p=this.location(parent,9);
        const young=this.spawnTree(p.x,p.z);
        if(young)this.log("A new tree grew from seed dispersal");
      }
    }
    if(this.time-this.lastBirth>32&&this.agents.length<170){
      this.lastBirth=this.time;
      const prosperous=this.agents.filter(a=>a.active&&a.hunger<50);
      if(prosperous.length>8&&this.rng.next()<.7){
        const parent=this.rng.pick(prosperous),p=this.location(parent,5);
        const baby=this.spawn(parent.type,p.x,p.z);
        if(baby)this.log("A new "+parent.type+" was born");
      }
    }
    // Keep the scene bounded even in longer sessions.
    if(this.agents.length>160)this.agents=this.agents.filter(a=>a.active);
  }
  intervene(kind,x,z){
    x=CLAMP(x,-10000,10000);z=CLAMP(z,-10000,10000);
    if(kind==="tree"){
      let count=0;
      for(let i=0;i<15;i++){
        const p={x:x+this.rng.between(-12,12),z:z+this.rng.between(-12,12)};
        if(this.spawnTree(p.x,p.z))count++;
      }
      this.log("God planted "+count+" trees");
    }else if(kind==="rain"){
      this.rain=35;this.fertility=CLAMP(this.fertility+.1,0,2);
      this.log("Rain fell and plants became more fertile");
    }else if(kind==="lightning"){
      const near=this.agents.filter(a=>a.active&&dist(a,{x,z})<8);
      for(const a of near){a.health-=90;if(a.health<=0)a.active=false}
      for(const tree of this.trees)if(tree.alive&&dist(tree,{x,z})<5)tree.alive=false;
      this.log("Lightning struck; "+near.length+" creatures were affected");
    }else if(["human","grazer","predator","bird"].includes(kind)){
      if(this.spawn(kind,x,z))this.log("God created a "+kind);
      else this.log("This creature cannot exist in this era or location");
    }else if(kind==="food"){
      for(const tree of this.trees)if(tree.alive&&dist(tree,{x,z})<16)tree.fruit=6;
      this.log("Food was replenished");
    }else if(kind==="hut"){
      if(this.era>=1310&&this.isLand(x,z)){
        this.structures.push({id:this.nextId++,x,z,progress:1,type:"hut"});
        this.log("God placed a shelter");
      }else this.log("Shelters require the civilization era and dry land");
    }
  }
  toJSON(){
    return {version:1,seed:this.seed,era:this.era,lat:this.lat,lon:this.lon,seaShift:this.seaShift,
      undergrowth:this.undergrowth.map(p=>({...p})),
      streamLoaded:[...(this.streamLoaded||[])],
      exploredChunks:[...(this.exploredChunks||[])],
      streamCache:[...(this.streamCache||new Map())],
      rng:this.rng.value,time:this.time,elapsed:this.elapsed,nextId:this.nextId,
      trees:this.trees.map(t=>({...t})),agents:this.agents.map(a=>({
        ...a,personality:{...a.personality},memory:{...a.memory},
        skill:{...a.skill},target:a.target?{...a.target}:null
      })),structures:this.structures.map(s=>({...s})),
      events:this.events.map(e=>({...e})),village:{...this.village},
      rain:this.rain,fertility:this.fertility,lastBirth:this.lastBirth,lastSeed:this.lastSeed};
  }
  static fromJSON(save){
    if(!save||save.version!==1||!Number.isInteger(save.seed)||save.seed<0||
      !Number.isFinite(save.era)||save.era<0||save.era>1600||
      !Number.isFinite(save.lat)||Math.abs(save.lat)>90||
      !Number.isFinite(save.lon)||Math.abs(save.lon)>180||
      !Array.isArray(save.agents)||save.agents.length>200||
      !Array.isArray(save.trees)||save.trees.length>800||
      !Array.isArray(save.structures)||save.structures.length>50||
      !Number.isFinite(save.time)||save.time<0||save.time>1e8||
      !Number.isFinite(save.nextId)||save.nextId<1||save.nextId>1000000||
      !Number.isFinite(save.rng))throw Error("Invalid regional save data");
    for(const entry of [...save.agents,...save.trees,...save.structures]){
      if(!Number.isFinite(entry.x)||!Number.isFinite(entry.z)||
        Math.abs(entry.x)>10000||Math.abs(entry.z)>10000||
        !Number.isInteger(entry.id)||entry.id<1)throw Error("Invalid saved creature or object");
    }
    const w=new SurfaceWorld(save.seed,save.era,save.lat,save.lon,save.seaShift||0);
    w.rng.value=save.rng;w.time=save.time;w.elapsed=save.elapsed||0;w.nextId=save.nextId;
    w.agents=save.agents.map(a=>({...a,personality:{...a.personality},
      memory:{...a.memory},skill:{...a.skill},target:a.target?{...a.target}:null}));
    w.trees=save.trees.map(t=>({...t}));w.structures=save.structures.map(s=>({...s}));
    if(save.undergrowth!==undefined){
      if(!Array.isArray(save.undergrowth)||save.undergrowth.length>2000||
        save.undergrowth.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.z)||
          Math.abs(p.x)>10000||Math.abs(p.z)>10000))throw Error("Invalid ground cover");
      w.undergrowth=save.undergrowth.map(p=>({...p}));
    }
    w.events=Array.isArray(save.events)?save.events.slice(0,25).map(e=>({...e})):[];
    if(save.streamLoaded!==undefined){
      if(!Array.isArray(save.streamLoaded)||save.streamLoaded.length>40||
        save.streamLoaded.some(k=>typeof k!=="string"||! /^-?\d+,-?\d+$/.test(k)))
        throw Error("Invalid active chunks");
      w.streamLoaded=new Set(save.streamLoaded);
    }
    if(save.exploredChunks!==undefined){
      if(!Array.isArray(save.exploredChunks)||save.exploredChunks.length>10000)
        throw Error("Invalid exploration state");
      w.exploredChunks=new Set(save.exploredChunks);
    }
    if(save.streamCache!==undefined){
      if(!Array.isArray(save.streamCache)||save.streamCache.length>96||
        save.streamCache.some(entry=>!Array.isArray(entry)||entry.length!==2||
          typeof entry[0]!=="string"||!entry[1]||
          !Array.isArray(entry[1].trees)||!Array.isArray(entry[1].cover)||
          !Array.isArray(entry[1].agents)||!Array.isArray(entry[1].structures)))
        throw Error("Invalid streamed chunk state");
      w.streamCache=new Map(save.streamCache);
    }
    w.village={...save.village};
    w.rain=Number(save.rain)||0;w.fertility=Number(save.fertility)||1;
    w.lastBirth=Number(save.lastBirth)||0;w.lastSeed=Number(save.lastSeed)||0;
    return w;
  }
  get counts(){
    return TYPES.reduce((out,type)=>(out[type]=this.agents.filter(a=>a.active&&a.type===type).length,out),{});
  }
}
