// Broad geomorphological feature vocabulary for a synthetic planet.
// These labels are heuristic terrain classifications, not surveyed real-world data.
// Landforms and water bodies are derived from the exact geographic sample used by
// both globe and ground. Small-scale 3D geomorphology will be refined over time.
export const LANDFORMS=Object.freeze([
 "mountain","mountain range","ridge","volcano","crater","highland","plateau","mesa",
 "hill","valley","canyon","gorge","cliff","plain","basin","desert","dune",
 "beach","island","peninsula","cape","isthmus","delta","floodplain","marsh",
 "wetland","glacier","cave entrance","coastal bluff"
]);
export const WATERS=Object.freeze([
 "ocean","sea","bay","gulf","strait","lagoon","lake","pond","river","stream",
 "estuary","waterfall","wetland","reef","fjord","channel","glacial inlet"
]);
const round=(v)=>Math.round(v);
export function classifyPhysicalFeature(s,nearby=null){
 const lat=s.lat,lon=s.lon,h=s.height,m=s.moisture;
 const factor=Math.sin(lat*.21+lon*.41)+.43*Math.sin(lon*.91-lat*.72);
 const coast=nearby?.coast??(h>-1.7&&h<2);
 const steep=nearby?.relief??Math.abs(2.6*Math.sin(lat*.73+lon*.46));
 const neighbors=nearby?.landNeighbors??(s.land?6:0);
 if(!s.land){
   if(s.waterKind==="lake")return {category:"water",name:h<.8?"pond":"lake",shore:coast};
   if(s.waterKind==="lagoon")return {category:"water",name:"lagoon",shore:true};
   if(s.waterKind==="sea")return {category:"water",name:"sea",shore:coast};
   if(Math.abs(lat)>67&&coast&&steep>1.8)return {category:"water",name:"fjord",shore:true};
   if(Math.abs(lat)>72&&coast)return {category:"water",name:"glacial inlet",shore:true};
   if(Math.abs(lat)<28&&coast&&h>-.9&&s.moisture>.54)
     return {category:"water",name:"reef",shore:true};
   if(coast&&factor>1.0)return {category:"water",name:"bay",shore:true};
   if(coast&&factor<-.9)return {category:"water",name:"gulf",shore:true};
   if(coast&&Math.abs(factor)<.18)
     return {category:"water",name:factor>0?"strait":"channel",shore:true};
   return {category:"water",name:"ocean",shore:coast};
 }
 if(s.river){
   if(coast)return {category:"water",name:"estuary",shore:true};
   if(h>6&&steep>2)return {category:"water",name:"waterfall",shore:false};
   return {category:"water",name:h<2?"river":"stream",shore:false};
 }
 if(s.biome==="ice")return {category:"land",name:"glacier",shore:false};
 if(coast){
   if(neighbors<=2)return {category:"land",name:factor>0?"island":"cape",shore:true};
   if(neighbors<=4)return {category:"land",name:factor>0?"peninsula":"isthmus",shore:true};
   if(h<.35&&m>.62)return {category:"land",name:"delta",shore:true};
   return {category:"land",name:steep>1.6?"coastal bluff":"beach",shore:true};
 }
 if(s.volcano>.36&&h>10)return {category:"land",name:"volcano",shore:false};
 if(s.volcano>.8&&h>12)return {category:"land",name:"crater",shore:false};
 if(h>3&&steep>2.7&&factor>.55)return {category:"land",name:"cave entrance",shore:false};
 if(h>10)return {category:"land",name:steep>2?"mountain range":"mountain",shore:false};
 if(h>8)return {category:"land",name:steep>1.5?"ridge":"highland",shore:false};
 if(h>5&&steep<.6)return {category:"land",name:factor>0?"plateau":"mesa",shore:false};
 if(h>4)return {category:"land",name:"hill",shore:false};
 if(h<-0.5&&steep>1.8)return {category:"land",name:factor>0?"canyon":"gorge",shore:false};
 if(h<1&&m>.73)return {category:"land",name:factor>0?"marsh":"floodplain",shore:false};
 if(h<1.6&&m>.67)return {category:"land",name:"wetland",shore:false};
 if(m<.26)return {category:"land",name:factor>.2?"dune":"desert",shore:false};
 if(steep>2&&h>2)return {category:"land",name:"cliff",shore:false};
 if(factor<-.9)return {category:"land",name:"valley",shore:false};
 if(factor>.9)return {category:"land",name:"basin",shore:false};
 return {category:"land",name:"plain",shore:false};
}
export function detailedPhysicalFeature(sample,around){
 // around(dx,dz) samples adjacent locations from the same canonical Earth sampler.
 if(!around)return classifyPhysicalFeature(sample);
 let landCount=0,min=Infinity,max=-Infinity;
 for(const [dx,dz] of [[-4,0],[4,0],[0,-4],[0,4],[-8,-8],[8,-8],[-8,8],[8,8]]){
   const g=around(dx,dz);
   if(g.land)landCount++;
   min=Math.min(min,g.height);max=Math.max(max,g.height);
 }
 return classifyPhysicalFeature(sample,{
   coast:landCount>0&&landCount<8||Math.abs(sample.height)<1.0,
   relief:max-min,landNeighbors:landCount
 });
}
