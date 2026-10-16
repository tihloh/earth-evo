// Deterministic, simplified Earth ecology + civilization model.
// Date labels and population units are illustrative, not measured historical data.
export const W = 44, H = 22, END = 1600;
export const AGES = [[0,4540000000],[120,4100000000],[240,3500000000],[400,2400000000],
  [580,1000000000],[700,600000000],[760,540000000],[870,430000000],
  [1010,230000000],[1150,66000000],[1250,3000000],[1310,12000],
  [1410,2000],[1490,226],[1540,0],[1600,-174]];
export const ERAS = [
  {t:0,label:"Molten Earth",description:"A young planet forms. The early environment is hostile to known life."},
  {t:120,label:"Cooling planet",description:"Crust and oceans develop through a long geological history."},
  {t:240,label:"Microbial life",description:"Early microorganisms establish lineages in ancient waters."},
  {t:400,label:"Oxygenation",description:"Photosynthesis begins changing Earth's atmosphere and oceans."},
  {t:580,label:"Complex cells",description:"Biological innovation creates new opportunities for life."},
  {t:700,label:"Multicellular seas",description:"Complex marine ecosystems gradually diversify."},
  {t:760,label:"Marine animals",description:"New animal guilds consume, compete, migrate and reproduce."},
  {t:870,label:"Life on land",description:"Terrestrial producers and consumers establish ecosystems."},
  {t:1010,label:"Age of reptiles",description:"Diverse animal communities occupy the land."},
  {t:1150,label:"Mass extinction",description:"A major impact sharply disrupts ecosystems."},
  {t:1250,label:"Human relatives",description:"Hominin-like lineages appear in this simplified model."},
  {t:1310,label:"Agriculture",description:"Some populations begin developing permanent settlements."},
  {t:1410,label:"Cities & trade",description:"Technology and settlements expand through human activity."},
  {t:1490,label:"Industrial world",description:"Human settlements and environmental impacts accelerate."},
  {t:1540,label:"Contemporary Earth",description:"Civilization reaches an interconnected, technologically complex stage."},
  {t:1600,label:"Possible futures",description:"Speculative outcomes depend on environmental and social conditions."}
];
export function yearsBeforePresent(t){
  t=Math.max(0,Math.min(END,t));
  for(let i=1;i<AGES.length;i++){
    if(t<=AGES[i][0]){
      const [a,ageA]=AGES[i-1],[b,ageB]=AGES[i];
      return ageA+(ageB-ageA)*(t-a)/(b-a);
    }
  }
  return -174;
}
export function dateLabel(t){
  const y=yearsBeforePresent(t);
  if(y>=1e9)return (y/1e9).toFixed(2)+" billion years ago";
  if(y>=1e6)return (y/1e6).toFixed(y<1e7?2:0)+" million years ago";
  if(y>12000)return (y/1000).toFixed(0)+" thousand years ago";
  if(y>2025)return Math.round(y-2026)+" BCE";
  const year=Math.round(2026-y);
  return year+(t>1540?" CE · speculative":" CE");
}
export function eraAt(t){
  for(let i=ERAS.length-1;i>=0;i--)if(t>=ERAS[i].t)return ERAS[i];
  return ERAS[0];
}
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function hash(x){return (Math.sin(x*127.1+78.233)*43758.5453)%1}
export class RNG{
  constructor(seed){this.value=(Number(seed)>>>0)||1}
  next(){let t=this.value+=0x6D2B79F5;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}
  between(a,b){return a+(b-a)*this.next()}
  pick(list){return list[Math.floor(this.next()*list.length)]}
}
function createWorld(seed){
  return Array.from({length:W*H},(_,i)=>{
    const x=i%W,y=Math.floor(i/W),lat=90-(y+.5)*180/H,lon=-180+(x+.5)*360/W;
    const a=lat*Math.PI/180,b=lon*Math.PI/180;
    const X=Math.cos(a)*Math.cos(b),Y=Math.sin(a),Z=Math.cos(a)*Math.sin(b);
    const v=Math.sin(X*3.9+Z*1.3+seed*.001)*.4+
      Math.cos(Z*4.1-Y*2.3+seed*.003)*.26+
      Math.sin(Y*4.8+X*2.9-Z*2.0)*.25+
      Math.sin(X*11+Z*12+seed*.004)*.12;
    const moisture=clamp(.70-.43*Math.abs(Y)+.24*Math.sin(b*2.6+Y*2.8),.10,1);
    return {i,x,y,lat,lon,elevation:v,moisture,fertility:clamp(.56+.26*Math.cos(X*3.5+b*1.4)-Math.abs(Y)*.19,.18,1)};
  });
}
const TYPES=["microbe","plant","grazer","predator","hominin"];
const RATES={microbe:.29,plant:.21,grazer:.145,predator:.115,hominin:.095};
const CAPS={microbe:40,plant:23,grazer:12,predator:5,hominin:3.2};
const FOOD={microbe:null,plant:null,grazer:"plant",predator:"grazer",hominin:"plant"};
function copySpecies(s){return {...s,genome:{...s.genome},pop:Float32Array.from(s.pop)}}
export class World{
  constructor(seed=42){this.interventions=[];this.reset(seed)}
  reset(seed=this.seed){
    this.seed=(Number(seed)>>>0)||42;this.rng=new RNG(this.seed);
    this.tick=0;this.cells=createWorld(this.seed);
    this.species=[];this.nextSpecies=1;this.settlements=[];
    this.events=[];this.eventId=0;this.warming=0;this.seaShift=0;this.cooling=0;this.cooldown=0;
    this.technology=0;this.oxygen=0;this.regions=Array.from({length:W*H},()=>({microbe:0,plant:0,grazer:0,predator:0,hominin:0}));
    this.totals={microbe:0,plant:0,grazer:0,predator:0,hominin:0};
    this.history=[];this._log("Planet formation begins");
    this._cache=new Map();this._saveSnapshot();
    return this;
  }
  _log(message){this.events.unshift({tick:this.tick,id:++this.eventId,message});if(this.events.length>65)this.events.pop()}
  get temperature(){return this.tick<120?18+1250*Math.pow(1-this.tick/120,4):17+3*Math.sin(this.tick*.018)+this.warming+this.cooling}
  get ocean(){return clamp(this.tick<120?.70*(this.tick/120):.70+this.seaShift,0,.94)}
  isLand(cell){return cell.elevation>.08+this.seaShift*.5}
  localTemp(cell){return this.temperature-30*Math.abs(cell.lat)/90+2*Math.cos(cell.lon*Math.PI/110)}
  fitness(s,c){
    if(this.isLand(c)!==(s.habitat==="land"))return 0;
    const temp=this.localTemp(c);
    const match=Math.exp(-Math.pow((temp-s.genome.opt)/s.genome.tolerance,2));
    return match*s.genome.efficiency*(s.habitat==="land"?c.moisture*.75+.25:1);
  }
  _spawn(name,type,habitat,parent=null){
    if(this.species.length>=26)return null;
    const genome=parent?{...parent.genome}:{
      opt:this.rng.between(12,28),tolerance:this.rng.between(19,31),
      efficiency:this.rng.between(.84,1.22),spread:this.rng.between(.015,.08)
    };
    if(parent){
      genome.opt=clamp(genome.opt+this.rng.between(-6,6),-8,43);
      genome.efficiency=clamp(genome.efficiency*this.rng.between(.88,1.13),.55,1.55);
      genome.tolerance=clamp(genome.tolerance+this.rng.between(-3,3),10,46);
      genome.spread=clamp(genome.spread*this.rng.between(.8,1.2),.009,.13);
    }
    const s={id:this.nextSpecies++,name,type,habitat,genome,parent:parent?.id??null,born:this.tick,
      extinct:false,pop:new Float32Array(W*H),total:0};
    if(parent){
      const sites=[];
      for(let i=0;i<parent.pop.length;i++)if(parent.pop[i]>1&&this.fitness(s,this.cells[i])>.3)sites.push(i);
      if(!sites.length)return null;
      const center=this.rng.pick(sites),c=this.cells[center];
      for(let i=0;i<s.pop.length;i++){
        const cell=this.cells[i];
        if(Math.abs(cell.x-c.x)<=3&&Math.abs(cell.y-c.y)<=2){
          const split=parent.pop[i]*.23;s.pop[i]=split;parent.pop[i]-=split;
        }
      }
    }else{
      const sites=[];
      for(let i=0;i<this.cells.length;i++)if(this.fitness(s,this.cells[i])>.45)sites.push(i);
      if(!sites.length)return null;
      for(let i=0;i<6;i++)s.pop[this.rng.pick(sites)]+=this.rng.between(2,5);
    }
    this.species.push(s);this._log(parent?"A new lineage branches: "+name:name+" emerges");
    return s;
  }
  _has(type,habitat){return this.species.some(s=>!s.extinct&&s.type===type&&(!habitat||s.habitat===habitat))}
  _seedLife(){
    const t=this.tick,total=this.totals;
    // Scientific dates motivate gates; local growth and population survival follow ecological rules.
    if(t>=180&&!this._has("microbe"))this._spawn("Ancestral microorganisms","microbe","sea");
    if(t>=395&&total.microbe>100&&!this._has("plant"))
      this._spawn("Photosynthetic microbes","plant","sea");
    if(t>=700&&total.plant>100&&!this._has("grazer"))
      this._spawn("Marine grazers","grazer","sea");
    if(t>=770&&total.grazer>35&&!this._has("predator"))
      this._spawn("Marine hunters","predator","sea");
    if(t>=870&&total.plant>100&&!this._has("plant","land"))
      this._spawn("Terrestrial plants","plant","land");
    if(t>=900&&total.grazer>45&&!this._has("grazer","land"))
      this._spawn("Land herbivores","grazer","land");
    if(t>=960&&total.predator>50&&!this._has("predator","land"))
      this._spawn("Land carnivores","predator","land");
    if(t>=1250&&total.grazer>40&&total.plant>150&&!this._has("hominin"))
      this._spawn("Human ancestral lineage","hominin","land");
    if(t%90===0&&t>300&&this.species.length<26){
      const parents=this.species.filter(s=>!s.extinct&&s.total>85&&s.type!=="hominin");
      if(parents.length&&this.rng.next()<.80){
        const p=this.rng.pick(parents);
        this._spawn(p.name+" · branch "+this.nextSpecies,p.type,p.habitat,p);
      }
    }
  }
  _ecology(){
    const n=this.cells.length;
    const sums={};for(const type of TYPES)sums[type]=new Float32Array(n);
    for(const s of this.species)if(!s.extinct)for(let i=0;i<n;i++)sums[s.type][i]+=s.pop[i];
    for(const s of this.species){
      if(s.extinct)continue;
      const next=new Float32Array(n),rate=RATES[s.type],capacity=CAPS[s.type];
      for(let i=0;i<n;i++){
        const p=s.pop[i];if(p<.000001)continue;
        const cell=this.cells[i],fit=this.fitness(s,cell);
        if(fit<=0)continue;
        let food=1;
        if(FOOD[s.type])food=clamp(sums[FOOD[s.type]][i]/(s.type==="predator"?4:7),.03,1.25);
        else if(s.type==="plant")food=cell.fertility;
        const scarcity=clamp(1-sums[s.type][i]/(capacity*fit+1),-1,1);
        const pred=s.type==="grazer"?sums.predator[i]*.015:s.type==="plant"?sums.grazer[i]*.003:0;
        const delta=rate*fit*food*scarcity-(1-fit)*.13-.025-pred;
        const survival=clamp(p*(1+delta),0,200);
        const wander=clamp(survival*s.genome.spread,0,survival*.3);
        next[i]+=survival-wander;
        const x=i%W,y=Math.floor(i/W);
        const adj=[y*W+(x+1)%W,y*W+(x+W-1)%W];
        if(y>0)adj.push(i-W);if(y<H-1)adj.push(i+W);
        for(const j of adj)next[j]+=wander/adj.length;
      }
      s.pop=next;
    }
    this.totals={microbe:0,plant:0,grazer:0,predator:0,hominin:0};
    for(const c of this.regions)for(const type of TYPES)c[type]=0;
    for(const s of this.species){
      let total=0;
      for(let i=0;i<n;i++){const p=s.pop[i];total+=p;this.regions[i][s.type]+=p}
      s.total=total;this.totals[s.type]+=total;
      if(total<.04&&this.tick>s.born+5&&!s.extinct){s.extinct=true;this._log(s.name+" becomes extinct")}
    }
    this.oxygen=clamp(this.totals.plant/9000*21,0,21);
  }
  _civilization(){
    if(this.tick<1310||this.totals.hominin<3)return;
    if(this.settlements.length<24&&this.tick%16===0){
      const possible=this.cells.filter(c=>this.isLand(c)&&this.regions[c.i].hominin>0.07&&
        !this.settlements.some(s=>Math.abs(s.x-c.x)<=2&&Math.abs(s.y-c.y)<=2));
      if(possible.length){
        possible.sort((a,b)=>this.regions[b.i].hominin*b.fertility-this.regions[a.i].hominin*a.fertility);
        const c=possible[Math.floor(this.rng.next()*Math.min(6,possible.length))];
        const place={x:c.x,y:c.y,i:c.i,name:"Settlement "+(this.settlements.length+1),
          population:12+this.rng.between(0,16),food:24,knowledge:0,age:0};
        this.settlements.push(place);this._log("New settlement founded");
      }
    }
    for(const s of this.settlements){
      const c=this.cells[s.i];s.age++;
      const yieldFood=Math.max(0,c.fertility*c.moisture*12+this.regions[s.i].plant*.1);
      const consumption=s.population*.028;
      s.food=clamp(s.food+yieldFood-consumption,0,200);
      const growth=(s.food>15?.025:-.09)*(1+this.technology*.015);
      s.population=clamp(s.population*(1+growth),.01,7000);
      if(s.food>10)s.knowledge+=.035+Math.log1p(s.population)*.004;
    }
    const count=this.settlements.filter(s=>s.population>=2);
    this.technology=clamp(this.technology+count.reduce((sum,s)=>sum+s.knowledge*.00006,0),0,100);
    if(this.tick%70===0&&count.length)this._log("Civilizations develop technologies and trade networks");
    if(this.tick>1470&&count.length)this.warming=clamp(this.warming+.002, -12,18);
  }
  _effects(kind){
    if(kind==="impact"){
      for(const s of this.species)for(let i=0;i<s.pop.length;i++)s.pop[i]*=s.type==="microbe"?.6:.24;
      for(const city of this.settlements)city.population*=.45;
      this.cooling=-12;this.cooldown=65;this._log("Major asteroid impact devastates ecosystems");
    }else if(kind==="volcano"){
      this.cooling=-7;this.cooldown=45;
      for(const s of this.species)for(let i=0;i<s.pop.length;i++)s.pop[i]*=.84;
      this._log("Large volcanic eruption causes climatic disruption");
    }else if(kind==="warm"){this.warming=clamp(this.warming+3,-12,18);this._log("Climate warmed by 3 °C")}
    else if(kind==="cool"){this.warming=clamp(this.warming-3,-12,18);this._log("Climate cooled by 3 °C")}
    else if(kind==="sea"){this.seaShift=clamp(this.seaShift+.055,-.2,.21);this._log("Sea level raised")}
    else if(kind==="seaDown"){this.seaShift=clamp(this.seaShift-.055,-.2,.21);this._log("Sea level lowered")}
    else return false;
    return true;
  }
  intervene(kind){
    if(!["impact","volcano","warm","cool","sea","seaDown"].includes(kind))return false;
    this.interventions.push({tick:this.tick,kind});
    this._effects(kind);this._cache.clear();this._saveSnapshot();
    return true;
  }
  _step(){
    if(this.tick>=END)return;
    this.tick++;
    if(this.tick===1150)this._effects("impact");
    if(this.cooldown>0){this.cooldown--;this.cooling*=.975;if(this.cooldown===0)this.cooling=0}
    this._seedLife();if(this.species.length)this._ecology();this._civilization();
    for(const action of this.interventions)if(action.tick===this.tick)this._effects(action.kind);
    if(this.tick%16===0)this.history.push({tick:this.tick,...this.totals,settlements:this.settlements.length,technology:this.technology});
    if(this.history.length>150)this.history.shift();
    if(this.tick%50===0)this._saveSnapshot();
  }
  step(count=1){for(let i=0;i<Math.min(600,Math.max(0,Math.floor(count)));i++)this._step();return this}
  _saveSnapshot(){
    this._cache.set(this.tick,{
      rng:this.rng.value,nextSpecies:this.nextSpecies,species:this.species.map(copySpecies),
      settlements:this.settlements.map(s=>({...s})),warming:this.warming,seaShift:this.seaShift,
      cooling:this.cooling,cooldown:this.cooldown,technology:this.technology,oxygen:this.oxygen,
      totals:{...this.totals},events:this.events.map(e=>({...e})),eventId:this.eventId,
      history:this.history.map(h=>({...h}))
    });
    if(this._cache.size>38)this._cache.delete(this._cache.keys().next().value);
  }
  _restore(tick,s){
    this.tick=tick;this.rng.value=s.rng;this.nextSpecies=s.nextSpecies;this.species=s.species.map(copySpecies);
    this.settlements=s.settlements.map(c=>({...c}));this.warming=s.warming;this.seaShift=s.seaShift;
    this.cooling=s.cooling;this.cooldown=s.cooldown;this.technology=s.technology;this.oxygen=s.oxygen;
    this.totals={...s.totals};this.events=s.events.map(e=>({...e}));this.eventId=s.eventId;
    this.history=s.history.map(h=>({...h}));this._rebuildRegions();
  }
  _rebuildRegions(){
    for(const c of this.regions)for(const type of TYPES)c[type]=0;
    for(const s of this.species)for(let i=0;i<s.pop.length;i++)this.regions[i][s.type]+=s.pop[i];
  }
  seek(target){
    target=clamp(Math.round(target),0,END);
    if(target===this.tick)return this;
    if(target<this.tick){
      let from=0;
      for(const k of this._cache.keys())if(k<=target&&k>=from)from=k;
      this._restore(from,this._cache.get(from));
    }
    // If target is far ahead, restore a previously calculated snapshot when available.
    let later=this.tick;
    for(const k of this._cache.keys())if(k<=target&&k>later)later=k;
    if(later>this.tick)this._restore(later,this._cache.get(later));
    while(this.tick<target)this._step();
    return this;
  }
  serialize(){return JSON.stringify({version:1,seed:this.seed,tick:this.tick,interventions:this.interventions})}
  static deserialize(text){
    const data=JSON.parse(text);
    if(data.version!==1||!Number.isInteger(data.seed)||!Number.isInteger(data.tick)||
      data.tick<0||data.tick>END||!Array.isArray(data.interventions)||
      data.interventions.length>200)throw Error("Invalid or incompatible save");
    const world=new World(data.seed);
    world.interventions=data.interventions.map(v=>{
      if(!Number.isInteger(v.tick)||v.tick<0||v.tick>data.tick||
        !["impact","volcano","warm","cool","sea","seaDown"].includes(v.kind))throw Error("Invalid intervention");
      return {tick:v.tick,kind:v.kind};
    });
    // For intervention events at tick zero, replay them before stepping.
    for(const a of world.interventions)if(a.tick===0)world._effects(a.kind);
    world._cache.clear();world._saveSnapshot();
    world.seek(data.tick);return world;
  }
  get speciesCount(){return this.species.filter(s=>!s.extinct).length}
  get totalPopulation(){return Object.values(this.totals).reduce((a,b)=>a+b,0)}
  get humanPopulation(){return this.settlements.reduce((a,b)=>a+b.population,0)}
}
