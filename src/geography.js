// The ONE geographic source for both the globe and the streamed local world.
// Coordinates are longitude/latitude in degrees; elevation and biome are synthetic.
// This is a deterministic procedural planet, NOT modern Earth's surveyed geography.
export const LOCAL_DEGREES_PER_UNIT = .018;
export const SEA_LEVEL = .08;
export const STREAM_CHUNK_SIZE = 48;
export const MAX_LAT = 89.8;
const RAD=Math.PI/180;
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function wrapLongitude(lon){
  return ((lon+180)%360+360)%360-180;
}
export function localToGeo(x,z,originLat,originLon){
  const lat=clamp(originLat-z*LOCAL_DEGREES_PER_UNIT,-MAX_LAT,MAX_LAT);
  const lon=wrapLongitude(originLon+x*LOCAL_DEGREES_PER_UNIT/
    Math.max(.12,Math.cos(originLat*RAD)));
  return {lat,lon};
}
export function geoToLocal(lat,lon,originLat,originLon){
  let delta=wrapLongitude(lon-originLon);
  return {x:delta*Math.max(.12,Math.cos(originLat*RAD))/LOCAL_DEGREES_PER_UNIT,
    z:(originLat-lat)/LOCAL_DEGREES_PER_UNIT};
}
// SphereGeometry UV mapping for the surfacePosition convention used in renderer.js:
// (-cos(lat) cos(lon), sin(lat), cos(lat) sin(lon)).
export function globeUVToGeo(u,v){
  return {lon:wrapLongitude(90-u*360),lat:clamp(90-v*180,-90,90)};
}
function elevationRaw(lat,lon,seed){
  const a=lat*RAD,b=lon*RAD;
  const X=Math.cos(a)*Math.cos(b),Y=Math.sin(a),Z=Math.cos(a)*Math.sin(b);
  const phase=seed*.001,phase2=seed*.003;
  // Stable global continents. Same base equation used by global ecosystem cells.
  const coarse=Math.sin(X*3.9+Z*1.3+phase)*.40+
    Math.cos(Z*4.1-Y*2.3+phase2)*.26+
    Math.sin(Y*4.8+X*2.9-Z*2.0)*.25+
    Math.sin(X*11+Z*12+seed*.004)*.12;
  // Continuous high-resolution detail on a sphere: no longitude seam.
  const detail=.105*Math.sin(X*83+Y*55+Z*38+seed*.013)*
                        Math.cos(Z*79-X*40+Y*62)+
    .055*Math.sin(X*210-Y*133+Z*71)*Math.sin(Z*151+Y*171)+
    .027*Math.cos(X*490+Z*388-Y*279)*Math.sin(Y*450+X*240);
  // Continuous mountain-building belts and narrow ridges. Sampling in spherical XYZ
  // keeps the mountain topology identical on the globe and ground, including at ±180°.
  const belt=Math.max(0,Math.sin(X*10.2+Z*6.5+seed*.004)*
    Math.cos(Y*8.7-X*3.9)-.12);
  const crest=Math.pow(1-Math.abs(Math.sin(X*96+Y*63-Z*79+seed*.01)),3);
  const uplift=.95*Math.pow(belt,1.2)*(.33+.67*crest);
  // Broad highland shoulders and dry incision; both are geographic elevation,
  // not separate decorative mountains that would diverge on the globe.
  const shoulder=.19*Math.max(0,Math.sin(X*36+Y*17+Z*25+seed*.02))*
    Math.max(0,belt-.10);
  const canyon=.10*Math.max(0,Math.cos(X*82-Z*73+Y*29))*Math.max(0,belt-.33);
  return coarse+detail+uplift+shoulder-canyon;
}
export function sampleGeography(lat,lon,seed=42,seaShift=0){
  lat=clamp(lat,-90,90);lon=wrapLongitude(lon);
  const elevation=elevationRaw(lat,lon,seed);
  const seaLevel=SEA_LEVEL+seaShift*.5;
  const above=elevation-seaLevel;
  const latitude=Math.abs(lat);
  const dry=Math.sin((lon*RAD)*2.6+(lat*RAD)*2.8);
  const moisture=clamp(.70-.40*latitude/90+.19*dry,.08,1);
  const temperature=27-41*latitude/90-9*Math.max(0,above);
  // One canonical elevation-to-height conversion for planet and region.
  const height=above*28;
  const lakeEligible=moisture>.68&&Math.sin(lat*.29+lon*.37+seed*.03)>.74;
  const lake=above>0&&above<.048&&lakeEligible;
  const land=above>0&&!lake;
  const coastal=Math.abs(height)<2.0;
  const marineRegion=Math.sin(lon*.16-lat*.22+seed*.006);
  const waterKind=lake?"lake":!land?(coastal&&marineRegion>.66?"lagoon":
    coastal||marineRegion>.34?"sea":"ocean"):null;
  const a=lat*RAD,b=lon*RAD;
  const x=Math.cos(a)*Math.cos(b),y=Math.sin(a),z=Math.cos(a)*Math.sin(b);
  // Procedural watersheds use the same spherical coordinate function in both views.
  const channel=Math.abs(Math.sin(x*92+y*57-z*24+seed*.002) +
    .24*Math.sin(z*38-y*19+x*44));
  const river=land&&moisture>.45&&height<8&&channel<.075;
  const alpine=height>10;
  const ice=latitude>74||temperature<-8;
  const wet=moisture>.65;
  const biome=!land?waterKind:river?"river":ice?"ice":alpine?"alpine":
    wet?"forest":moisture<.35?"dryland":"grassland";
  return {lat,lon,elevation,seaLevel,height,land,lake,lakeEligible,coastal,waterKind,
    river,channel,moisture,temperature,biome};
}
export function sampleLocal(x,z,originLat,originLon,seed=42,seaShift=0){
  const p=localToGeo(x,z,originLat,originLon);
  return sampleGeography(p.lat,p.lon,seed,seaShift);
}
// Deterministic scout locations. Searches are based on the SAME geography, not
// arbitrary hand-placed landmarks. No claim that coordinates represent real Earth.
export function findScenicLocation(kind,seed=42,seaShift=0){
  const kinds=["mountain","coast","lake","river","island","forest","desert"];
  if(!kinds.includes(kind))throw Error("Unknown landscape type");
  let best=null,bestScore=-Infinity;
  for(let lat=-72;lat<=72;lat+=6)for(let lon=-174;lon<180;lon+=6){
    const s=sampleGeography(lat,lon,seed,seaShift);
    const around=[[1.5,0],[-1.5,0],[0,1.5],[0,-1.5]].map(([dx,dy])=>
      sampleGeography(lat+dy,lon+dx,seed,seaShift));
    const nWater=around.filter(p=>!p.land).length;
    const relief=Math.max(...around.map(p=>p.height))-Math.min(...around.map(p=>p.height));
    let score=-Infinity;
    if(kind==="mountain"&&s.land)score=s.height+2.7*relief+(s.height>15?20:0);
    if(kind==="coast"&&s.land&&nWater>0)score=10+relief+nWater*4;
    if(kind==="lake"&&s.waterKind==="lake")score=40+relief;
    if(kind==="river"&&s.river)score=40+relief+s.moisture*2;
    if(kind==="island"&&s.land&&nWater>=2)score=20+nWater*10;
    if(kind==="forest"&&s.land&&s.biome==="forest")score=10+s.moisture*20+relief;
    if(kind==="desert"&&s.land&&s.biome==="dryland")score=10+(1-s.moisture)*20+relief;
    if(score>bestScore){bestScore=score;best={lat,lon,kind,height:s.height,score}}
  }
  return best;
}
export function globeReliefRadius(sample,planetRadius=2.35){
  return planetRadius+(sample.land?Math.min(.115,Math.max(0,sample.height)*.0028):0);
}
export function globeColor(sample,era=1540){
  const h=sample.height;
  if(era<120){
    const lava=clamp(1-era/120,0,1);
    return [clamp(91+119*lava+h*4,0,255),clamp(35+38*lava,0,255),29];
  }
  if(!sample.land){
    if(sample.waterKind==="lake")return [34,102,144];
    if(sample.waterKind==="lagoon")return [32,125,144];
    const coast=clamp(1+sample.height/4,0,1);
    return [Math.round(9+23*coast),Math.round(52+52*coast),Math.round(102+58*coast)];
  }
  if(sample.river)return [37,126,167];
  if(sample.ice)return [216,225,231];
  if(sample.biome==="alpine")return [134,130,118];
  if(era<870)return [137,113,90];
  if(sample.biome==="forest")return [50,120,74];
  if(sample.biome==="grassland")return [113,151,85];
  return [171,148,101];
}
