import test from "node:test";
import assert from "node:assert/strict";
import {stitchedTerrainHeight,terrainSeamKey} from "../src/terrain-lod.js";
import {tileSegments} from "../src/zoom-continuum.js";
import {readFileSync} from "node:fs";

const H=(x,z)=>Math.sin(x*.21)*8+Math.cos(z*.13)*5;
test("high-detail boundary exactly follows a neighboring low-detail mesh edge",()=>{
 const size=48,cx=1,cz=-2,high=64,low=8;
 for(let row=0;row<=high;row++){
   const v=stitchedTerrainHeight(H,cx,cz,size,high,0,row,{left:low});
   const position=row*low/high,lowI=Math.min(low-1,Math.floor(position));
   const t=position-lowI,z0=cz*size+lowI*size/low;
   const neighborEdge=H(cx*size,z0)*(1-t)+H(cx*size,z0+size/low)*t;
   assert.ok(Math.abs(v-neighborEdge)<1e-10,"row "+row+" crack");
 }
});
test("shared corners are continuous even with two different low-detail neighbors",()=>{
 const h=stitchedTerrainHeight(H,0,0,48,64,0,0,{left:8,top:16});
 assert.ok(Math.abs(h-H(0,0))<1e-10);
 assert.equal(terrainSeamKey({left:8,right:16,top:4,bottom:32}),"8/16/4/32");
});
test("LOD is nested and horizon geometry does not overlap visible tiles",()=>{
 const levels=[tileSegments(0,10),tileSegments(60,50),
  tileSegments(110,60),tileSegments(190,90),tileSegments(400,120)];
 assert.deepEqual(levels,[64,32,16,8,4]);
 const source=readFileSync(new URL("../src/horizon-terrain.js",import.meta.url),"utf8");
 assert.match(source,/const detailMin=-nearRadius\*chunk/);
 assert.match(source,/const detailMax=\(nearRadius\+1\)\*chunk/);
 assert.match(source,/if\(inNear\|\|d>outerRadius\)continue/);
});
