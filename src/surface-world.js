// Lightweight regional autonomous-agent ecology. This is a goal/need-based AI simulation,
// not a conscious mind or a historical reconstruction. No Three.js dependency.
import {RNG} from "./simulation.js";
import {sampleLocal} from "./geography.js";
import {SPECIES,PLANTS,chooseSpecies,choosePlant,permitted,humanStyle} from "./era-ecology.js";
import {detailedPhysicalFeature} from "./physical-features.js";

export const REGION_SIZE = 180;
// Initial spawn extent only; terrain itself is streamed without a square boundary.
const CLAMP=(v,a,b)=>Math.max(a,Math.min(b,v));
const TYPES=["human","grazer","predator","bird","marine"];
function dist(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
export class SurfaceWorld {
  constructor(seed=42,era=1490,lat=5,lon=0,seaShift=0){
    this.seed=(seed>>>0)||42;this.era=era;this.lat=lat;this.lon=lon;this.seaShift=seaShift;
    this.terrainSeed=(this.seed+Math.round(lat*37)+Math.round(lon*19))>>>0;
    this.rng=new RNG(this.terrainSeed||7);
    this.time=0;this.elapsed=0;this.nextId=1;this.agents=[];this.trees=[];this.undergrowth=[];
    this.structures=[];this.events=[];this.rain=0;this.fertility=1;
    this.weather="clear";this.weatherTimer=0;this.wind=0;this.weatherIntensity=0;
    this.village={x:-12,z:-14,wood:0,food:14};
    this.lastBirth=0;this.lastSeed=0;
    this.populate();
  }
  sample(x,z){return sampleLocal(x,z,this.lat,this.lon,this.seed,this.seaShift)}
  height(x,z){return this.sample(x,z).height}
  featureAt(x,z){
    const g=this.sample(x,z);
    return detailedPhysicalFeature(g,(dx,dz)=>this.sample(x+dx,z+dz));
  }
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
    return choosePlant(this.era,this.sample(x,z),this.rng,true);
  }
  spawnTree(x,z){
    if(!this.isLand(x,z)||this.trees.length>=800)return null;
    const species=this.chooseTreeSpecies(x,z);
    if(!species)return null;
    const t={id:this.nextId++,x,z,species,
      size:this.rng.between(.65,1.65),fruit:this.rng.between(1,5),
      wood:this.rng.between(1,3),alive:true};
    this.trees.push(t);return t;
  }
  growGroundCover(count=650){
    if(this.era<870)return;
    for(let i=0;i<count&&this.undergrowth.length<2000;i++){
      const x=this.rng.between(-87,87),z=this.rng.between(-87,87);
      const g=this.sample(x,z);if(!g.land||g.height>12)continue;
      const species=choosePlant(this.era,g,this.rng,false);
      // Modern groundcover families are post-flowering-plant approximations.
      const modern=["grass","flower","bush","fern","heather","reed","scrub"];
      const roll=this.rng.next();
      const ground=this.era>=1120?(g.river?"reed":modern[Math.floor(roll*modern.length)]):
        species|| (this.era>=900?"clubmoss":"earlyMoss");
      this.undergrowth.push({x,z,species:ground,
        size:this.rng.between(.55,1.3),angle:this.rng.between(0,Math.PI*2)});
    }
  }
  spawn(type,x,z,speciesOverride=null){
    if(!TYPES.includes(type)||this.agents.length>=190)return null;
    const g=this.sample(x,z);
    const species=speciesOverride||chooseSpecies(this.era,g,this.rng,type);
    if(!species||!SPECIES[species]||SPECIES[species].guild!==type||
      !permitted(SPECIES[species],this.era,g))return null;
    const definition=SPECIES[species];
    const a={id:this.nextId++,type,species,habitat:definition.habitat,x,z,
      rotation:this.rng.between(0,Math.PI*2),size:definition.size,
      hunger:this.rng.between(0,35),thirst:this.rng.between(4,32),
      energy:this.rng.between(40,100),health:100,
      age:0,goal:"exploring",reason:"Curious about the surroundings",
      personality:{curiosity:this.rng.between(0,1),courage:this.rng.between(0,1),
        sociability:this.rng.between(0,1),diligence:this.rng.between(0,1)},
      memory:{lastFood:null,lastDanger:null,lastWater:null,lastCompanion:null},
      skill:{survival:0,craft:0},style:type==="human"?humanStyle(this.era,g):null,
      target:null,decision:0,carried:0,food:0,active:true,
      altitude:0,motion:{speed:0,mode:"idle",stride:0},familyId:null};
    this.agents.push(a);return a;
  }
  populate(){
    this.village=this.location({x:-12,z:-14},25);
    this.village.wood=0;this.village.food=14;
    if(this.era>=890){
      for(let i=0;i<280;i++){
        const p=this.location({x:0,z:0},85);this.spawnTree(p.x,p.z);
      }
    }
    this.growGroundCover(950);
    if(this.era>=760){
      let created=0,tries=0;
      while(created<24&&tries++<320){
        const x=this.rng.between(-88,88),z=this.rng.between(-88,88);
        if(this.spawn("marine",x,z))created++;
      }
    }
    if(this.era>=895){
      for(let i=0;i<35;i++){
        const p=this.location({x:-15,z:8},60);this.spawn("grazer",p.x,p.z);
      }
    }
    if(this.era>=955){
      for(let i=0;i<9;i++){
        const p=this.location({x:18,z:-9},70);this.spawn("predator",p.x,p.z);
      }
    }
    if(this.era>=1020)for(let i=0;i<16;i++){
      const p=this.location();this.spawn("bird",p.x,p.z);
    }
    if(this.era>=1250){
      const humans=this.era>=1310?14:6;
      for(let i=0;i<humans;i++){
        const p=this.location(this.village,22);this.spawn("human",p.x,p.z);
      }
    }
    if(this.era>=1310&&this.counts.human>0){
      this.village.wood=9;
      for(let i=0;i<2;i++){
        const p=this.location(this.village,8);
        if(this.isLand(p.x,p.z))
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
      resting:"Low energy: resting and recovering",
      drinking:"Dehydrated: searching for fresh water",
      herding:"Following a nearby member of the herd",
      stalking:"Approaching prey more carefully",
      fishing:"Searching coastal waters for fish",
      migrating:"Seeking more suitable habitat",
      guarding:"Keeping near the settlement",
      feeding:"Feeding within a safe habitat",
      nesting:"Resting in a sheltered location",
      socializing:"Companionship and cooperative relationships matter",
      flying:"Searching for food and navigating the sky",
      patrolling:"Searching the surroundings for prey",
      wandering:"Exploring the surrounding territory",
      exploring:"Curiosity drives the search for new territory"
    })[goal]||"Exploring the environment";
  }
  randomDestination(a,goal="wandering"){
    if(a.type==="marine"){
      for(let i=0;i<28;i++){
        const x=a.x+this.rng.between(-24,24),z=a.z+this.rng.between(-24,24);
        if(!this.isLand(x,z)){this.destination(a,{x,z},goal);return}
      }
      this.destination(a,{x:a.x,z:a.z},goal);return;
    }
    this.destination(a,this.location({x:a.x,z:a.z},24),goal);
  }
  freshwater(a){
    if(a.memory.lastWater&&this.time-a.memory.lastWater.time<90){
      const known=a.memory.lastWater;
      if(this.sample(known.x,known.z).river)return known;
    }
    let best=null,score=Infinity;
    for(let radius=5;radius<=35;radius+=7){
      for(let dir=0;dir<12;dir++){
        const angle=dir*Math.PI/6,px=a.x+Math.cos(angle)*radius,
          pz=a.z+Math.sin(angle)*radius,s=this.sample(px,pz);
        if(!s.river&&s.waterKind!=="lake")continue;
        if(radius<score){best={x:px,z:pz};score=radius}
      }
      if(best)break;
    }
    if(best)a.memory.lastWater={...best,time:this.time};
    return best;
  }
  decide(a){
    if(!a.active)return;
    if(a.energy<23&&!["fleeing","escaping danger"].includes(a.goal)){
      this.destination(a,a,"resting");return;
    }
    const aquatic=a.type==="marine";
    if(aquatic){
      const bigger=this.nearest(a,"marine",p=>p.size>a.size*1.45,19);
      if(bigger&&a.hunger<75){
        const dx=a.x-bigger.x,dz=a.z-bigger.z,d=Math.max(.1,Math.hypot(dx,dz));
        this.destination(a,{x:a.x+dx/d*22,z:a.z+dz/d*22},"fleeing");
      }else if(!a.target||this.rng.next()<.18){
        this.randomDestination(a,"feeding");
      }
      return;
    }
    const flying=a.type==="bird";
    const grazer=a.type==="grazer";
    if(grazer||flying){
      const predator=this.nearest(a,"predator",()=>true,
        flying?9:14+(1-a.personality.courage)*9);
      if(predator){
        a.memory.lastDanger={x:predator.x,z:predator.z,time:this.time};
        const dx=a.x-predator.x,dz=a.z-predator.z,d=Math.max(.1,Math.hypot(dx,dz));
        this.destination(a,{x:a.x+dx/d*26,z:a.z+dz/d*26},"fleeing");
        return;
      }
      if(a.thirst>57){
        const water=this.freshwater(a);
        if(water){this.destination(a,water,"drinking");return}
      }
      const species=SPECIES[a.species]||{};
      if(flying&&species.diet==="fish"&&a.hunger>29){
        const fish=this.nearest(a,"marine",()=>true,40);
        if(fish){this.destination(a,fish,"fishing");return}
      }
      const remembered=a.memory.lastFood&&this.trees.find(t=>t.id===a.memory.lastFood&&t.alive&&t.fruit>.5);
      const tree=remembered&&dist(a,remembered)<35?remembered:
        this.nearest(a,"tree",t=>t.fruit>.5,30);
      if(a.hunger>38&&tree){this.destination(a,tree,"foraging");return}
      const other=this.nearest(a,a.type,other=>other.species===a.species,26);
      if(other&&this.rng.next()<.27+a.personality.sociability*.2){
        this.destination(a,other,"herding");return;
      }
      if(!a.target||this.rng.next()<.18)this.randomDestination(a,flying?"flying":"grazing");
      return;
    }
    if(a.type==="predator"){
      if(a.thirst>70){
        const water=this.freshwater(a);
        if(water){this.destination(a,water,"drinking");return}
      }
      const prey=this.nearest(a,"grazer",()=>true,38+13*a.personality.courage);
      if(a.hunger>24&&prey){
        this.destination(a,prey,a.hunger>70?"hunting":"stalking");return;
      }
      if(!a.target||this.rng.next()<.14)this.randomDestination(a,"patrolling");
      return;
    }
    const threat=this.nearest(a,"predator",()=>true,12+(1-a.personality.courage)*9);
    if(threat){
      a.memory.lastDanger={x:threat.x,z:threat.z,time:this.time};
      const dx=a.x-threat.x,dz=a.z-threat.z,d=Math.max(.1,Math.hypot(dx,dz));
      this.destination(a,{x:a.x+dx/d*26,z:a.z+dz/d*26},"escaping danger");return;
    }
    if(a.thirst>53){
      const water=this.freshwater(a);
      if(water){this.destination(a,water,"drinking");return}
    }
    const known=a.memory.lastFood&&this.trees.find(t=>t.id===a.memory.lastFood&&t.alive&&t.fruit>.5);
    const tree=known&&dist(a,known)<55?known:
      this.nearest(a,"tree",t=>t.fruit>1||t.wood>0,56);
    if(a.hunger>37&&a.food<1&&a.personality.courage>.5&&this.rng.next()<.35){
      const prey=this.nearest(a,"grazer",()=>true,58);
      if(prey){this.destination(a,prey,"hunting");return}
    }
    if(a.hunger>42&&a.food<1&&tree?.fruit>0){
      this.destination(a,tree,"collecting food");return;
    }
    if(a.hunger>40&&a.food>0){
      a.food--;a.hunger=CLAMP(a.hunger-50,0,100);
      this.destination(a,a,"resting");return;
    }
    if(this.era>=1310&&a.carried<2&&tree?.wood>.3&&
      (a.personality.diligence>.22||this.village.wood<3)){
      this.destination(a,tree,"gathering timber");return;
    }
    if(a.carried>=2){this.destination(a,this.village,"delivering timber");return}
    if(this.era>=1310&&this.village.wood>=3&&this.structures.length<22){
      this.destination(a,this.village,"building shelter");return;
    }
    const other=this.nearest(a,"human",()=>true,35);
    if(other&&this.rng.next()<.12+.47*a.personality.sociability){
      a.memory.lastCompanion=other.id;
      this.destination(a,other,"socializing");return;
    }
    if(!a.target||this.rng.next()<.22)this.randomDestination(a,"exploring");
  }
  move(a,dt){
    if(!a.target){this.decide(a);return}
    let x=a.target.x,z=a.target.z;
    const dest=a.target.id?this.agents.find(v=>v.id===a.target.id&&v.active)||
      this.trees.find(v=>v.id===a.target.id&&v.alive):null;
    if(dest){x=dest.x;z=dest.z}
    const dx=x-a.x,dz=z-a.z,d=Math.hypot(dx,dz);
    const radius=a.goal==="resting"?1.3:a.goal==="hunting"||a.goal==="stalking"?2.6:1.3;
    if(d>radius){
      const spec=SPECIES[a.species],base=spec?.speed||2.5;
      const flee=a.goal==="fleeing"||a.goal==="escaping danger";
      const speed=base*(flee?1.56:a.goal==="stalking"?.56:1)*
        (a.energy<25?.65:1);
      const step=Math.min(d,speed*dt);
      const nx=CLAMP(a.x+dx/d*step,-10000,10000),
        nz=CLAMP(a.z+dz/d*step,-10000,10000);
      const terrain=this.sample(nx,nz);
      const canGo=a.type==="bird"||a.type==="marine"?!terrain.land:terrain.land;
      if(canGo||a.type==="bird"){
        a.x=nx;a.z=nz;
        const aim=Math.atan2(dx,dz);
        a.rotation+=Math.atan2(Math.sin(aim-a.rotation),
          Math.cos(aim-a.rotation))*Math.min(1,dt*8);
        a.energy=CLAMP(a.energy-dt*(flee?2.0:.40),0,100);
        a.motion={speed,mode:a.goal,stride:(a.motion?.stride||0)+dt*speed*4};
      }else{a.target=null;a.decision=0;a.motion={speed:0,mode:"idle",stride:0}}
      return;
    }
    a.motion={speed:0,mode:a.goal,stride:a.motion?.stride||0};
    this.onArrival(a,dest);
    a.target=null;a.decision=0;
  }
  onArrival(a,target){
    if(["hunting","stalking"].includes(a.goal)&&target&&target.type==="grazer"&&
      target.active&&dist(a,target)<3){
      target.health=0;target.active=false;a.hunger=CLAMP(a.hunger-60,0,100);a.energy=CLAMP(a.energy+26,0,100);
      a.skill.survival=CLAMP(a.skill.survival+.12,0,10);
      if(a.type==="human")a.food+=2;
      this.log((a.type==="human"?"Human":"Predator")+" #"+a.id+" hunted grazer #"+target.id);return;
    }
    if(a.type==="marine"&&a.goal==="feeding"){
      a.hunger=Math.max(0,a.hunger-32);a.energy=Math.min(100,a.energy+7);return;
    }
    if(a.goal==="fishing"&&target?.type==="marine"&&target.active&&dist(a,target)<4){
      target.active=false;
      a.hunger=Math.max(0,a.hunger-40);
      a.skill.survival=CLAMP(a.skill.survival+.1,0,10);
      this.log(a.species+" #"+a.id+" caught "+target.species);return;
    }
    if(a.goal==="drinking"){
      a.thirst=0;a.energy=Math.min(100,a.energy+5);
      return;
    }
    if(a.goal==="resting"||a.goal==="nesting"){
      a.energy=Math.min(100,a.energy+23);
      a.thirst=Math.min(100,a.thirst+2);
      return;
    }
    if(a.goal==="herding"){
      a.energy=Math.min(100,a.energy+2);return;
    }
    if((a.goal==="foraging"||a.goal==="collecting food")&&target?.fruit>0){
      const n=Math.min(target.fruit,a.type==="human"?2:1.5);target.fruit-=n;
      a.memory.lastFood=target.id;
      a.thirst=Math.max(0,a.thirst-10);
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
    this.weatherTimer+=dt;
    if(this.weatherTimer>42){
      this.weatherTimer=0;
      const g=this.sample(this.village.x,this.village.z),roll=this.rng.next();
      const cold=g.temperature<4;
      this.weather=cold&&roll<.31?"snow":
        roll<g.moisture*.30?"rain":
        roll<.11?"windy":g.moisture<.38&&roll<.30?"dust":
        roll<.42?"cloudy":"clear";
      this.weatherIntensity=this.weather==="clear"?0:this.rng.between(.4,.9);
      this.wind=this.rng.between(-1,1);
      this.log("Weather: "+this.weather);
    }
    for(const tree of this.trees)if(tree.alive){
      tree.fruit=CLAMP(tree.fruit+dt*(this.rain? .08:.022)*this.fertility,0,6);
    }
    for(const a of this.agents){
      if(!a.active)continue;
      a.age+=dt;
      a.hunger=CLAMP(a.hunger+dt*(a.type==="bird"?1.1:.7),0,110);
      a.thirst=CLAMP((a.thirst||0)+dt*(a.type==="marine"?.05:.55),0,110);
      if(this.weather==="rain"||this.rain>0)
        a.thirst=CLAMP(a.thirst-dt*.35,0,110);
      a.energy=CLAMP(a.energy+dt*.6,0,100);
      if(a.hunger>97)a.health-=dt*3;
      if(a.thirst>97)a.health-=dt*4;
      const spec=SPECIES[a.species];
      if(spec&&this.era>=spec.max)a.health-=dt*12;
      if(a.health<=0){a.active=false;this.log(a.type+" #"+a.id+" died");continue}
      a.decision-=dt;
      if(a.decision<=0){
        this.decide(a);a.decision=.8+this.rng.between(0,.7);
      }
      this.move(a,dt);
      if(a.type==="bird")a.altitude=2.8+1.6*Math.sin(a.age*2+a.id);
      if(a.type==="marine")a.altitude=.0;
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
        const parent=this.rng.pick(prosperous);
        let p=this.location(parent,5);
        if(parent.type==="marine"){
          p={x:parent.x+this.rng.between(-2,2),
             z:parent.z+this.rng.between(-2,2)};
          if(this.isLand(p.x,p.z))p={x:parent.x,z:parent.z};
        }
        const baby=this.spawn(parent.type,p.x,p.z,parent.species);
        if(baby){
          baby.size=parent.size*.57;
          baby.familyId=parent.id;
          baby.personality=Object.fromEntries(Object.entries(parent.personality).map(
            ([key,value])=>[key,CLAMP(value+this.rng.between(-.14,.14),0,1)]));
          baby.memory.lastCompanion=parent.id;
        }
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
    }else if(["human","grazer","predator","bird","marine"].includes(kind)){
      const creature=this.spawn(kind,x,z);
      if(creature)this.log("God introduced "+creature.species+" to this habitat");
      else this.log("Species unavailable in this era or location");
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
      rain:this.rain,fertility:this.fertility,lastBirth:this.lastBirth,lastSeed:this.lastSeed,
      weather:this.weather,weatherTimer:this.weatherTimer,weatherIntensity:this.weatherIntensity,
      wind:this.wind};
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
    w.weather=["clear","cloudy","rain","snow","windy","dust"].includes(save.weather)?
      save.weather:"clear";
    w.weatherTimer=Number(save.weatherTimer)||0;
    w.weatherIntensity=Number(save.weatherIntensity)||0;
    w.wind=Number(save.wind)||0;
    w.lastBirth=Number(save.lastBirth)||0;w.lastSeed=Number(save.lastSeed)||0;
    return w;
  }
  get counts(){
    return TYPES.reduce((out,type)=>(out[type]=this.agents.filter(a=>a.active&&a.type===type).length,out),{});
  }
}
