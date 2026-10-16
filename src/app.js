import {World,W,H,END,ERAS,eraAt,dateLabel} from "./simulation.js";
import {PlanetView} from "./renderer.js";
import {SurfaceWorld} from "./surface-world.js";
import {ecologyStageAt,SPECIES} from "./era-ecology.js";
import {findScenicLocation} from "./geography.js";
import {SurfaceView} from "./surface-view.js";
import {enterSurfaceAt,ZOOM_CROSSFADE_MS} from "./zoom-transition.js";
import * as THREE from "three";

const $=id=>document.getElementById(id);
let world=new World(42);
const view=new PlanetView($("globe"),$("globeViewport"));
let playing=false,speed=12,accumulator=0,lastFrame=performance.now();
let pendingSeek=null,seekFrame=false,rendering=false;
let localActive=false,localView=null,localWorld=null,localEra=-1,localSeed=-1;
let focus={lat:-20,lon:-55},inspectedId=null,lastLocalUi=0;
let focusPinned=false,transitionToken=0;
const hudState={left:window.innerWidth>850,right:window.innerWidth>710};
function setHud(side,opened){
  if(side!=="left"&&side!=="right")return;
  hudState[side]=Boolean(opened);
  document.body.classList.toggle("hud-hide-"+side,!hudState[side]);
  const button=$(side==="left"?"toggleLeft":"toggleRight");
  button.setAttribute("aria-expanded",String(hudState[side]));
  button.classList.toggle("selected",hudState[side]);
}
setHud("left",hudState.left);
setHud("right",hudState.right);
$("toggleLeft").addEventListener("click",()=>setHud("left",!hudState.left));
$("toggleRight").addEventListener("click",()=>setHud("right",!hudState.right));
$("fogMode").addEventListener("change",e=>{
  if(localView)localView.setFogMode(e.target.value);
});
$("weatherMode").addEventListener("change",e=>{
  if(localView)localView.setWeatherChoice(e.target.value);
});
$("renderDistance").addEventListener("change",e=>{
  if(localView)localView.setRenderDistance(Number(e.target.value));
});
$("cameraGlide").addEventListener("change",e=>{
  const value=Number(e.target.value);
  view.setGlide(value);
  if(localView)localView.setGlide(value);
});

function refreshSpeciesPicker(){
  const picker=$("speciesPicker"),keep=picker.value;
  picker.replaceChildren();
  for(const [id,spec] of Object.entries(SPECIES)){
    if(world.tick<spec.min||world.tick>=spec.max||id==="human"&&world.tick<1250)continue;
    const option=document.createElement("option");
    option.value=id;
    option.textContent=id.replace(/([A-Z])/g," $1").trim()+" · "+spec.guild;
    picker.append(option);
  }
  if([...picker.options].some(option=>option.value===keep))picker.value=keep;
  $("summonSpecies").disabled=picker.options.length===0;
  if(localView)localView.selectedSpecies=picker.value||null;
}
$("visitLandscape").addEventListener("click",()=>{
  const kind=$("landscapePicker").value;
  const site=findScenicLocation(kind,world.seed,world.seaShift);
  if(!site){$("localTerrainInfo").textContent="No matching terrain found in this seed.";return}
  focus={lat:site.lat,lon:site.lon};localWorld=null;
  createSurface(true);
  if(localView){
    const y=localWorld.height(0,0);
    localView.controls.target.set(0,y,0);
    localView.camera.position.set(54,y+36,79);
    localView.controls.update();localView.updateTiles(true);
  }
  updateLocalUi(true);
});
$("speciesPicker").addEventListener("change",event=>{
  if(localView)localView.selectedSpecies=event.target.value;
});
$("summonSpecies").addEventListener("click",()=>{
  if(!localView||!$("speciesPicker").value)return;
  localView.selectedSpecies=$("speciesPicker").value;
  localView.setAction("species");
  document.querySelectorAll("[data-god-action]").forEach(button=>
    button.classList.remove("selected"));
  $("summonSpecies").classList.add("selected");
  $("creatureInspector").textContent=
    "Click a compatible habitat to create "+$("speciesPicker").value+".";
});
$("zoomCreature").addEventListener("click",()=>{
  const a=localWorld?.agents.find(a=>a.id===inspectedId&&a.active);
  if(!a||!localView)return;
  const y=localWorld.height(a.x,a.z),scale=Math.max(.45,a.size||1);
  const dist=Math.max(4.5,Math.min(16,scale*5.5));
  const dx=Math.sin(a.rotation),dz=Math.cos(a.rotation);
  localView.controls.target.set(a.x,y+1.5*scale,a.z);
  localView.camera.position.set(a.x+dx*dist,y+2.2*scale+dist*.32,a.z+dz*dist);
  localView.controls.update();
  localView.followAgentId=a.id;
  localView.updateTiles(true);
  updateLocalUi(true);
});
function createSurface(force=false){
  if(!localActive)return;
  const era=eraAt(world.tick).t+"/"+ecologyStageAt(world.tick);
  if(force||!localWorld||era!==localEra||localSeed!==world.seed||
    localWorld.seaShift!==world.seaShift||
    Math.abs(localWorld.lat-focus.lat)>1e-5||
    Math.abs(localWorld.lon-focus.lon)>1e-5){
    localEra=era;localSeed=world.seed;
    localWorld=new SurfaceWorld(world.seed,world.tick,focus.lat,focus.lon,world.seaShift);
    inspectedId=null;
    if(localView)localView.setWorld(localWorld);
  }
  refreshSpeciesPicker();
  updateLocalUi(true);
}
// A zoom gesture crosses scales with an animated overlapping render. The
// planet and detailed region share their geographic sampler but use different
// geometry/scale domains; the crossfade avoids a hard blank-screen cut.
function centerPlanetFocus(){
  const ray=new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(0,0),view.camera);
  const hit=ray.intersectObject(view.planet)[0];
  if(!hit)return focus;
  const radial=view.root.worldToLocal(hit.point.clone()).normalize();
  return {lat:Math.asin(radial.y)*180/Math.PI,
    lon:Math.atan2(radial.z,-radial.x)*180/Math.PI};
}
function alignSurfaceCamera(){
  if(!localView||!localWorld)return;
  const point=view.surfacePosition(focus.lon,focus.lat,2.35);
  const relative=view.camera.position.clone().sub(point);
  const lat=focus.lat*Math.PI/180,lon=focus.lon*Math.PI/180;
  const east=new THREE.Vector3(Math.sin(lon),0,Math.cos(lon));
  const north=new THREE.Vector3(Math.sin(lat)*Math.cos(lon),
    Math.cos(lat),-Math.sin(lat)*Math.sin(lon));
  let x=relative.dot(east),z=-relative.dot(north);
  const length=Math.hypot(x,z);
  if(length<.03){x=.55;z=.83}else{x/=length;z/=length}
  const height=localWorld.height(0,0);
  localView.controls.target.set(0,height,0);
  localView.camera.position.set(x*91,height+61,z*91);
  localView.controls.update();
  localView.updateTiles(true);
}
function alignPlanetCamera(){
  if(!localWorld||!localView)return;
  const t=localView.controls.target;
  const point=localWorld.sample(t.x,t.z);
  focus={lat:point.lat,lon:point.lon};
  const radial=view.surfacePosition(focus.lon,focus.lat,1).normalize();
  view.controls.target.set(0,0,0);
  view.camera.position.copy(radial.multiplyScalar(4.65));
  view.controls.update();
}
function blendWorldView(toSurface){
  const token=++transitionToken;
  $("globeViewport").hidden=false;
  $("surfaceViewport").hidden=false;
  if(toSurface){
    localView.visible=true;
    view.controls.enabled=false;
    localView.controls.enabled=true;
    requestAnimationFrame(()=>{
      if(token===transitionToken)document.body.classList.add("world-surface");
    });
  }else{
    view.controls.enabled=true;
    if(localView)localView.controls.enabled=false;
    document.body.classList.remove("world-surface");
  }
  // Reduced-motion clients use a near-instant transition (matching CSS).
  const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  setTimeout(()=>{
    if(token!==transitionToken)return;
    if(toSurface)$("globeViewport").hidden=true;
    else{
      $("surfaceViewport").hidden=true;
      if(localView)localView.visible=false;
    }
  },reduced?50:ZOOM_CROSSFADE_MS+60);
}
function enterSurface(){
  if(localActive)return;
  setPlaying(false);
  if(!focusPinned)focus=centerPlanetFocus();
  focusPinned=false;localActive=true;
  $("surfaceViewport").hidden=false;
  $("localPanel").hidden=false;
  createSurface(false);
  if(!localView)localView=new SurfaceView($("surface"),$("surfaceViewport"),localWorld,{
    onSelect:showInspection,
    onExit:leaveSurface,
    onAction:()=>updateLocalUi(true)
  });
  localView.visible=true;localView.speed=Number($("localSpeed").value);
  localView.setGlide(Number($("cameraGlide").value));
  localView.setRenderDistance(Number($("renderDistance").value));
  localView.setFogMode($("fogMode").value);
  localView.setWeatherChoice($("weatherMode").value);
  refreshSpeciesPicker();
  localView.resize();
  alignSurfaceCamera();
  setHud("left",false);setHud("right",true);
  blendWorldView(true);
  updateLocalUi(true);
}
function leaveSurface(){
  if(!localActive)return;
  alignPlanetCamera();
  localActive=false;
  $("localPanel").hidden=true;
  if(window.innerWidth>850)setHud("left",true);
  blendWorldView(false);
}
function showInspection(agent){
  inspectedId=agent?.id??null;
  if(localView&&localView.followAgentId!==null&&inspectedId!==localView.followAgentId)localView.followAgentId=null;
  updateLocalUi(true);
}
function updateLocalUi(force=false){
  if(!localActive||!localWorld||(!force&&performance.now()-lastLocalUi<450))return;
  lastLocalUi=performance.now();
  if(localView){
    const target=localView.controls.target;
    const p=localWorld.sample(target.x,target.z);
    const feature=localWorld.featureAt(target.x,target.z);
    $("localLabel").textContent="Open world · "+p.lat.toFixed(3)+"°, "+
      p.lon.toFixed(3)+"° · "+feature.name+" · "+localView.terrainChunks.size+" tiles";
    $("localTerrainInfo").textContent=
      "Terrain: "+feature.name+" · biome: "+p.biome+
      " · water: "+(p.waterKind||"land")+" · weather: "+localView.effectiveWeather()+
      " · elevation: "+p.height.toFixed(1)+" simulation units";
  }
  const counts=localWorld.counts;
  $("localHumans").textContent=counts.human;$("localGrazers").textContent=counts.grazer;
  $("localPredators").textContent=counts.predator;$("localBirds").textContent=counts.bird;
  $("localBuildings").textContent=localWorld.structures.length;
  $("localMarine").textContent=counts.marine||0;
  let agent=localWorld.agents.find(a=>a.id===inspectedId);
  const canFollow=agent?.active===true;
  $("followCreature").disabled=!canFollow;
  $("zoomCreature").disabled=!canFollow;
  $("followCreature").textContent=localView?.followAgentId===inspectedId&&canFollow?
    "◉ Stop following":"◎ Follow selected creature";
  if(inspectedId!==null&&!agent)agent=localWorld.structures.find(a=>a.id===inspectedId);
  const out=$("creatureInspector");
  if(agent){
    const htmlSafe=str=>String(str).replace(/[&<>"']/g,char=>
      ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
    const type=agent.type==="hut"?"Shelter":
      (agent.species?agent.species.replace(/([A-Z])/g," $1").trim():agent.type);
    const details=agent.type==="hut"?"Built structure":
      "Goal: <span class='goal'>"+htmlSafe(agent.goal)+"</span>"+
      "<br>Hunger: "+Math.round(agent.hunger)+" / 100"+
      " · Thirst: "+Math.round(agent.thirst||0)+" / 100"+
      " · Energy: "+Math.round(agent.energy)+" / 100"+
      "<br>Health: "+Math.round(agent.health)+" / 100"+
      (agent.personality?
        "<br>Curiosity: "+Math.round(agent.personality.curiosity*100)+
        " · Courage: "+Math.round(agent.personality.courage*100)+
        " · Sociability: "+Math.round(agent.personality.sociability*100)+
        "<br>Motivation: "+htmlSafe(agent.reason||"Exploring")+
        (agent.style?"<br>Culture: "+htmlSafe(agent.style.period)+
          " · clothing: "+htmlSafe(agent.style.outfit):"")+
        "<br>Survival experience: "+(agent.skill?.survival||0).toFixed(2):"")+
      (agent.type==="human"?"<br>Collected wood: "+agent.carried.toFixed(1)+
        " · Building skill: "+(agent.skill?.craft||0).toFixed(2):"");
    out.innerHTML="<strong>"+htmlSafe(type)+" #"+agent.id+"</strong><br>"+details;
  }else out.textContent="Click a person, animal, bird or shelter in Inspect mode to observe its behavior.";
  const list=$("localEvents");list.replaceChildren();
  for(const event of localWorld.events.slice(0,5)){
    const li=document.createElement("li"),s=document.createElement("small"),msg=document.createElement("span");
    s.textContent="Regional time "+event.time.toFixed(0)+"s";msg.textContent=event.message;
    li.append(s,msg);list.append(li);
  }
}
$("followCreature").addEventListener("click",()=>{
  if(!localView||inspectedId===null)return;
  localView.followAgentId=localView.followAgentId===inspectedId?null:inspectedId;
  updateLocalUi(true);
});
$("localPause").addEventListener("click",()=>{
  if(!localView)return;
  localView.paused=!localView.paused;
  $("localPause").textContent=localView.paused?"▶ Resume life":"Ⅱ Pause life";
  $("localPause").setAttribute("aria-pressed",String(localView.paused));
});
$("localSpeed").addEventListener("change",e=>{if(localView)localView.speed=Number(e.target.value)});
$("enterSurface").addEventListener("click",enterSurface);
$("leaveSurface").addEventListener("click",leaveSurface);
let pointStart=null;
$("globe").addEventListener("pointerdown",e=>pointStart={x:e.clientX,y:e.clientY});
$("globe").addEventListener("pointerup",e=>{
  if(!pointStart||Math.hypot(pointStart.x-e.clientX,pointStart.y-e.clientY)>7)return;
  const rect=$("globe").getBoundingClientRect();
  const mouse=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,
    -(e.clientY-rect.top)/rect.height*2+1);
  const ray=new THREE.Raycaster();ray.setFromCamera(mouse,view.camera);
  const hit=ray.intersectObject(view.planet);
  if(hit.length){
    const p=view.root.worldToLocal(hit[0].point.clone()).normalize();
    focus={lat:Math.asin(p.y)*180/Math.PI,lon:Math.atan2(p.z,-p.x)*180/Math.PI};
    focusPinned=true;
    $("globeSelection").textContent="Area selected: "+focus.lat.toFixed(1)+"°, "+focus.lon.toFixed(1)+"° · Zoom in to explore";
  }
});
document.querySelectorAll("[data-god-action]").forEach(button=>button.addEventListener("click",()=>{
  if(localView)localView.setAction(button.dataset.godAction);
  document.querySelectorAll("[data-god-action]").forEach(b=>b.classList.toggle("selected",b===button));
  if(button.dataset.godAction!=="inspect")$("creatureInspector").textContent=
    "Power selected: "+button.textContent.trim()+". Click the landscape to apply.";
  else updateLocalUi(true);
}));
const fmt=num=>num>=1e6?(num/1e6).toFixed(2)+"M":num>=1e3?(num/1000).toFixed(1)+"K":num.toFixed(0);
function setPlaying(value){
  playing=Boolean(value)&&world.tick<END;
  $("play").textContent=playing?"Ⅱ Pause":"▶ Play";
  $("play").setAttribute("aria-pressed",String(playing));
}
function go(tick){
  world.seek(tick);refresh();
}
function renderTimeline(){
  const p=world.tick/END*100;
  $("timeScrubber").value=String(world.tick);
  $("timeScrubber").style.setProperty("--progress",p+"%");
  $("clockText").textContent=dateLabel(world.tick);
  $("tickText").textContent="Simulation tick "+world.tick.toLocaleString()+" / "+END.toLocaleString();
  const era=eraAt(world.tick);
  $("eraText").textContent=era.label;
  $("eraDescription").textContent=era.description;
  for(const button of $("eraMarks").children){
    button.classList.toggle("active",Number(button.dataset.tick)<=world.tick);
    button.setAttribute("aria-current",Number(button.dataset.tick)===era.t?"step":"false");
  }
}
function refresh(force=false){
  view.update(world,force);
  if(localActive)createSurface();
  renderTimeline();
  $("temperature").textContent=Math.round(world.temperature)+" °C";
  $("ocean").textContent=Math.round(world.ocean*100)+"%";
  $("oxygen").textContent=world.oxygen.toFixed(1)+"%";
  $("speciesCount").textContent=String(world.speciesCount);
  $("microbes").textContent=fmt(world.totals.microbe);
  $("flora").textContent=fmt(world.totals.plant);
  $("animals").textContent=fmt(world.totals.grazer+world.totals.predator);
  $("hominins").textContent=fmt(world.totals.hominin);
  $("settlements").textContent=String(world.settlements.filter(s=>s.population>2).length);
  $("humanPop").textContent=fmt(world.humanPopulation);
  $("technology").textContent=world.technology.toFixed(1);
  const viable=world.species.filter(s=>!s.extinct&&s.total>.01).sort((a,b)=>b.total-a.total);
  const speciesList=$("speciesList");speciesList.replaceChildren();
  if(!viable.length){const p=document.createElement("p");p.className="empty";p.textContent="No living species yet. Move forward into the emergence of life.";speciesList.append(p)}
  for(const s of viable.slice(0,7)){
    const li=document.createElement("li"),name=document.createElement("span"),amount=document.createElement("strong");
    name.textContent=s.name;amount.textContent=fmt(s.total);
    li.append(name,amount);speciesList.append(li);
  }
  const eventList=$("eventList");eventList.replaceChildren();
  for(const ev of world.events.slice(0,5)){
    const li=document.createElement("li"),date=document.createElement("small"),label=document.createElement("span");
    date.textContent=dateLabel(ev.tick);label.textContent=ev.message;li.append(date,label);eventList.append(li);
  }
}
function stepTo(tick){
  setPlaying(false);go(Math.max(0,Math.min(END,tick)));
}
function scheduleSeek(value){
  pendingSeek=Number(value);$("previewClock").textContent=dateLabel(pendingSeek);
  if(seekFrame)return;seekFrame=true;
  requestAnimationFrame(()=>{
    seekFrame=false;
    if(pendingSeek===null)return;
    const target=pendingSeek;pendingSeek=null;stepTo(target);
  });
}
for(const era of ERAS){
  const button=document.createElement("button");
  button.className="era-marker";button.type="button";button.dataset.tick=String(era.t);
  button.style.left=(era.t/END*100)+"%";button.title=era.label+" · "+dateLabel(era.t);
  button.setAttribute("aria-label","Jump to "+era.label);button.textContent="│";
  button.addEventListener("click",()=>stepTo(era.t));
  $("eraMarks").appendChild(button);
}
$("timeScrubber").addEventListener("input",e=>scheduleSeek(e.target.value));
$("timeScrubber").addEventListener("change",e=>scheduleSeek(e.target.value));
$("play").addEventListener("click",()=>setPlaying(!playing));
$("start").addEventListener("click",()=>stepTo(0));
$("end").addEventListener("click",()=>stepTo(END));
$("back").addEventListener("click",()=>stepTo(world.tick-1));
$("forward").addEventListener("click",()=>stepTo(world.tick+1));
$("prevEra").addEventListener("click",()=>{
  const previous=[...ERAS].reverse().find(e=>e.t<world.tick);
  stepTo(previous?previous.t:0);
});
$("nextEra").addEventListener("click",()=>{
  const next=ERAS.find(e=>e.t>world.tick);
  stepTo(next?next.t:END);
});
$("speed").addEventListener("change",e=>{speed=Number(e.target.value)});
$("restart").addEventListener("click",()=>{
  setPlaying(false);world=new World(Number($("seed").value)||42);
  $("previewClock").textContent="";refresh(true);
});
$("seed").addEventListener("keydown",e=>{if(e.key==="Enter")$("restart").click()});
document.querySelectorAll("[data-intervention]").forEach(button=>button.addEventListener("click",()=>{
  if(world.intervene(button.dataset.intervention)){setPlaying(false);refresh()}
}));
$("save").addEventListener("click",()=>{
  const saved={version:2,planet:JSON.parse(world.serialize()),
    surface:localWorld&&localSeed===world.seed&&localEra===eraAt(world.tick).t+"/"+ecologyStageAt(world.tick)?
      localWorld.toJSON():null,
    focus};
  const blob=new Blob([JSON.stringify(saved)],{type:"application/json"});
  const url=URL.createObjectURL(blob),anchor=document.createElement("a");
  anchor.href=url;anchor.download="earth-evo-"+world.seed+"-"+world.tick+".json";anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  $("status").textContent="Simulation saved to a JSON file.";
});
$("load").addEventListener("click",()=>$("loadFile").click());
$("loadFile").addEventListener("change",async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
    const data=JSON.parse(await file.text());
    if(data.version===2){
      world=World.deserialize(JSON.stringify(data.planet));
      focus={lat:Number.isFinite(data.focus?.lat)&&Math.abs(data.focus.lat)<=90?data.focus.lat:5,
        lon:Number.isFinite(data.focus?.lon)&&Math.abs(data.focus.lon)<=180?data.focus.lon:10};
      localWorld=data.surface?SurfaceWorld.fromJSON(data.surface):null;
      localEra=localWorld?eraAt(world.tick).t+"/"+ecologyStageAt(world.tick):-1;
      localSeed=localWorld?world.seed:-1;
      if(localActive&&localView&&localWorld)localView.setWorld(localWorld);
    }else{
      world=World.deserialize(JSON.stringify(data));
      localWorld=null;localEra=-1;localSeed=-1;
    }
    $("seed").value=String(world.seed);setPlaying(false);refresh(true);
    $("status").textContent="Simulation loaded.";
  }catch(error){$("status").textContent="Unable to load save: "+error.message}
  event.target.value="";
});
function animate(now){
  const dt=Math.min(.12,(now-lastFrame)/1000);lastFrame=now;
  if(enterSurfaceAt(view.camera.position.distanceTo(view.controls.target),localActive))enterSurface();
  if(localActive)updateLocalUi();
  if(playing){
    accumulator+=dt*speed;
    const n=Math.floor(accumulator);
    if(n>0){
      accumulator-=n;world.seek(Math.min(END,world.tick+Math.min(n,60)));
      if(world.tick===END)setPlaying(false);
      // Skip expensive UI rebuilds during high-speed playback, but always keep the clock synced.
      if(now-rendering>70){refresh();rendering=now;}
    }
  }else accumulator=0;
  requestAnimationFrame(animate);
}
$("previewClock").textContent="";
refresh(true);requestAnimationFrame(animate);
