// Deterministic triangle clipping for inland water, independent of Three.js.
// Unlike drawing entire wet grid squares, the polygon ends exactly at a sampled
// freshwater edge. Adjacent chunks query the same canonical geographic field.
export function waterSignal(sample){
  if(sample.waterKind==="lake")return 1;
  if(!sample.land||sample.height>=8||sample.moisture<=.45)return -1;
  return (.075-sample.channel)*13.5;
}
export function waterSurfaceHeight(sample){
  // Basin lakes are a level surface; rivers track their original channel.
  return sample.waterKind==="lake"?1.40:sample.height+.13;
}
function between(a,b){
  const t=a.w/(a.w-b.w);
  return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,
    y:a.y+(b.y-a.y)*t,w:0};
}
export function clipWaterTriangle(a,b,c){
  const verts=[a,b,c],polygon=[];
  for(let i=0;i<3;i++){
    const current=verts[i],next=verts[(i+1)%3];
    const inside=current.w>=0,nextInside=next.w>=0;
    if(inside&&nextInside)polygon.push(next);
    else if(inside&&!nextInside)polygon.push(between(current,next));
    else if(!inside&&nextInside)polygon.push(between(current,next),next);
  }
  const triangles=[];
  for(let i=1;i<polygon.length-1;i++)
    triangles.push(polygon[0],polygon[i],polygon[i+1]);
  return triangles;
}
