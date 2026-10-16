// Lightweight regional autonomous-agent ecology. This is a goal/need-based AI simulation,
// not a conscious mind or a historical reconstruction. No Three.js dependency.
import {RNG} from "./simulation.js";

export const REGION_SIZE = 180;
const HALF=REGION_SIZE/2;
const CLAMP=(v,a,b)=>Math.max(a,Math.min(b,v));
const TYPES=["human","grazer","predator","bird"];
function dist(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
export function riverX(z,seed=0){return 16+12*Math.sin(z*.029+seed*.003)+5*Math.sin(z*.087)}
export function terrainHeight(x,z,seed=0){
  const hills=2.3*Math.sin(x*.055+seed*.005)*Math.cos(z*.055)+
    1.6*Math.sin(x*.12+z*.07)+.8*Math.cos(z*.17-x*.11);
  const peaks=11*Math.exp(-((x+51)**2/650+(z+22)**2/960))+
    15*Math.exp(-((x-61)**2/520+(z-38)**2/940))+
    9*Math.exp(-((x+30)**2/700+(z-67)**2/790));
  const valley=5.2*Math.exp(-(((x-riverX(z,seed))/6.3)**2));
  const archipelago=-8*Math.exp(-((x+77)**2/250+(z-32)**2/900))-
    6*Math.exp(-((x-80)**2/380+(z+64)**2/700));
  return hills+peaks-valley+archipelago;
}
export class SurfaceWorld {
  constructor(seed=42,era=1490,lat=5,lon=0){
    this.seed=(seed>>>0)||42;this.era=era;this.lat=lat;this.lon=lon;
    this.terrainSeed=(this.seed+Math.round(lat*37)+Math.round(lon*19))>>>0;
    this.rng=new RNG(this.terrainSeed||7);
    this.time=0;this.elapsed=0;this.nextId=1;this.agents=[];this.trees=[];
    this.structures=[];this.events=[];this.rain=0;this.fertility=1;
    this.village={x:-12,z:-14,wood:0,food:14};
    this.lastBirth=0;
    this.populate();
  }
  height(x,z){return terrainHeight(x,z,this.terrainSeed)}
  isLand(x,z){return x>-HALF+4&&x<HALF-4&&z>-HALF+4&&z<HALF-4&&this.height(x,z)>-1.4}
  location(prefer={x:0,z:0},range=65){
    for(let t=0;t<100;t++){
      const x=CLAMP(prefer.x+this.rng.between(-range,range),-86,86);
      const z=CLAMP(prefer.z+this.rng.between(-range,range),-86,86);
      if(this.isLand(x,z)&&this.height(x,z)<9)return {x,z};
    }
    return {x:0,z:0};
  }
  log(message){this.events.unshift({time:Math.floor(this.time),message});if(this.events.length>25)this.events.length=25}
  spawnTree(x,z){
    if(!this.isLand(x,z)||this.trees.length>=600)return null;
    const t={id:this.nextId++,x,z,size:this.rng.between(.75,1.6),fruit:this.rng.between(1,5),wood:this.rng.between(1,3),alive:true};
    this.trees.push(t);return t;
  }
  spawn(type,x,z){
    if(!TYPES.includes(type)||!this.isLand(x,z)||this.agents.length>=190)return null;
    if(type==="human"&&this.era<1250)return null;
    if(type==="bird"&&this.era<1010)return null;
    const a={id:this.nextId++,type,x,z,rotation:this.rng.between(0,Math.PI*2),
      hunger:this.rng.between(0,35),energy:this.rng.between(40,100),health:100,
      age:0,goal:"exploring",target:null,decision:0,carried:0,food:0,active:true,altitude:0};
    this.agents.push(a);return a;
  }
  populate(){
    const trees=this.era>=870?280:0;
    for(let i=0;i<trees;i++){const p=this.location({x:0,z:0},85);this.spawnTree(p.x,p.z)}
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
      this.structures.push({id:this.nextId++,x:-17,z:-13,progress:1,type:"hut"});
      this.structures.push({id:this.nextId++,x:-8,z:-12,progress:1,type:"hut"});
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
  destination(a,p,goal){a.target={x:p.x,z:p.z,id:p.id??null};a.goal=goal}
  randomDestination(a,goal="wandering"){
    this.destination(a,this.location({x:a.x,z:a.z},24),goal);
  }
  decide(a){
    if(!a.active)return;
    if(a.type==="grazer"||a.type==="bird"){
      const predator=this.nearest(a,"predator",()=>true,a.type==="bird"?12:19);
      if(predator){
        const dx=a.x-predator.x,dz=a.z-predator.z,d=Math.max(.01,Math.hypot(dx,dz));
        this.destination(a,{x:CLAMP(a.x+dx/d*27,-83,83),z:CLAMP(a.z+dz/d*27,-83,83)},"fleeing");
        return;
      }
      const tree=this.nearest(a,"tree",t=>t.fruit>.5,30);
      if(a.hunger>38&&tree){this.destination(a,tree,"foraging");return}
      if(!a.target||this.rng.next()<.12)this.randomDestination(a,a.type==="bird"?"flying":"grazing");
      return;
    }
    if(a.type==="predator"){
      const prey=this.nearest(a,"grazer",()=>true,46);
      if(a.hunger>23&&prey){this.destination(a,prey,"hunting");return}
      if(!a.target||this.rng.next()<.1)this.randomDestination(a,"patrolling");
      return;
    }
    // Human goal-based behavior: danger > food > shelter materials > building > socializing.
    const threat=this.nearest(a,"predator",()=>true,14);
    if(threat){
      const dx=a.x-threat.x,dz=a.z-threat.z,d=Math.max(.01,Math.hypot(dx,dz));
      this.destination(a,{x:CLAMP(a.x+dx/d*23,-85,85),z:CLAMP(a.z+dz/d*23,-85,85)},"escaping danger");
      return;
    }
    const tree=this.nearest(a,"tree",t=>t.fruit>1||t.wood>0,56);
    if(a.hunger>42&&a.food<1&&tree&&tree.fruit>0){
      this.destination(a,tree,"collecting food");return;
    }
    if(a.hunger>40&&a.food>0){a.food--;a.hunger=CLAMP(a.hunger-50,0,100);a.goal="eating";return}
    if(this.era>=1310&&a.carried<2&&tree&&tree.wood>.3){
      this.destination(a,tree,"gathering timber");return;
    }
    if(a.carried>=2){this.destination(a,this.village,"delivering timber");return}
    if(this.era>=1310&&this.village.wood>=3&&this.structures.length<22){
      this.destination(a,this.village,"building shelter");return;
    }
    const other=this.nearest(a,"human",()=>true,35);
    if(other&&this.rng.next()<.3){this.destination(a,other,"socializing");return}
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
      const nx=CLAMP(a.x+dx/d*step,-86,86),nz=CLAMP(a.z+dz/d*step,-86,86);
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
      this.log("Predator #"+a.id+" hunted grazer #"+target.id);return;
    }
    if((a.goal==="foraging"||a.goal==="collecting food")&&target?.fruit>0){
      const n=Math.min(target.fruit,a.type==="human"?2:1.5);target.fruit-=n;
      if(a.type==="human"){a.food+=n;a.goal="eating";a.hunger=Math.max(0,a.hunger-26)}
      else a.hunger=Math.max(0,a.hunger-48);
      return;
    }
    if(a.goal==="gathering timber"&&target?.wood>0){
      const n=Math.min(2,target.wood);target.wood-=n;a.carried+=n;
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
      const px=CLAMP(this.village.x+Math.cos(angle)*radial,-80,80);
      const pz=CLAMP(this.village.z+Math.sin(angle)*radial,-80,80);
      if(this.isLand(px,pz)){
        this.structures.push({id:this.nextId++,x:px,z:pz,type:"hut",progress:1});
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
    x=CLAMP(x,-85,85);z=CLAMP(z,-85,85);
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
  get counts(){
    return TYPES.reduce((out,type)=>(out[type]=this.agents.filter(a=>a.active&&a.type===type).length,out),{});
  }
}
