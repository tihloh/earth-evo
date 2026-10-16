import {World,W,H,END,ERAS,eraAt,dateLabel} from "./simulation.js";
import {PlanetView} from "./renderer.js";

const $=id=>document.getElementById(id);
let world=new World(42);
const view=new PlanetView($("globe"),$("globeViewport"));
let playing=false,speed=12,accumulator=0,lastFrame=performance.now();
let pendingSeek=null,seekFrame=false,rendering=false;
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
function refresh(){
  view.update(world,true);
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
  $("noData").hidden=world.tick!==0;
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
  $("previewClock").textContent="";refresh();
});
$("seed").addEventListener("keydown",e=>{if(e.key==="Enter")$("restart").click()});
document.querySelectorAll("[data-intervention]").forEach(button=>button.addEventListener("click",()=>{
  if(world.intervene(button.dataset.intervention)){setPlaying(false);refresh()}
}));
$("save").addEventListener("click",()=>{
  const blob=new Blob([world.serialize()],{type:"application/json"});
  const url=URL.createObjectURL(blob),anchor=document.createElement("a");
  anchor.href=url;anchor.download="earth-evo-"+world.seed+"-"+world.tick+".json";anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  $("status").textContent="Simulation saved to a JSON file.";
});
$("load").addEventListener("click",()=>$("loadFile").click());
$("loadFile").addEventListener("change",async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
    const data=await file.text();world=World.deserialize(data);
    $("seed").value=String(world.seed);setPlaying(false);refresh();
    $("status").textContent="Simulation loaded.";
  }catch(error){$("status").textContent="Unable to load save: "+error.message}
  event.target.value="";
});
function animate(now){
  const dt=Math.min(.12,(now-lastFrame)/1000);lastFrame=now;
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
refresh();requestAnimationFrame(animate);
