// Stitch high-resolution terrain tile borders to adjacent lower-resolution
// terrain edges. Shared coarse vertices are preserved; intermediate samples
// interpolate between them, preventing cracks/T-junctions at LOD changes.
// This does not mutate the canonical geography sampler.
export function terrainSeamKey(edges){
  return ["left","right","top","bottom"].map(k=>edges[k]||0).join("/");
}
export function stitchedTerrainHeight(heightAt,cx,cz,size,segments,col,row,edges){
  const lower=[];
  function edgeSample(other,index,vertical,coord){
    if(!Number.isInteger(other)||other<=0||other>=segments)return;
    const step=size/other;
    const fraction=index*other/segments;
    const k=Math.min(other-1,Math.floor(fraction));
    const t=fraction-k;
    const origin=vertical?cz*size:cx*size;
    const x0=vertical?coord:origin+k*step;
    const x1=vertical?coord:origin+(k+1)*step;
    const z0=vertical?origin+k*step:coord;
    const z1=vertical?origin+(k+1)*step:coord;
    lower.push(heightAt(x0,z0)*(1-t)+heightAt(x1,z1)*t);
  }
  if(col===0)edgeSample(edges.left,row,true,cx*size);
  if(col===segments)edgeSample(edges.right,row,true,(cx+1)*size);
  if(row===0)edgeSample(edges.top,col,false,cz*size);
  if(row===segments)edgeSample(edges.bottom,col,false,(cz+1)*size);
  if(lower.length)return lower.reduce((a,b)=>a+b,0)/lower.length;
  return heightAt(cx*size+col*size/segments,cz*size+row*size/segments);
}
