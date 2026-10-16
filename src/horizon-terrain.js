// A single inexpensive horizon shell made from the SAME geographic samples
// as detailed terrain. Never spawn plants/agents on this far-away geometry.
import * as THREE from "three";
const rgb={ocean:0x6286a4,lake:0x4f9fbb,lagoon:0x4f9fbb,river:0x568eae,
 ice:0xe3e8e5,alpine:0x999b9a,forest:0x618e76,
 grassland:0x9eaa7f,dryland:0xbeaa86};
const color=new THREE.Color(),sky=new THREE.Color(0xb7cddd);
export function buildHorizonTerrain(world,cx,cz,nearRadius=3){
 const chunk=48,outerRadius=Math.max(nearRadius+5,9)*chunk;
 const step=24,centerX=cx*chunk,centerZ=cz*chunk;
 const verts=[],colors=[];
 let tris=0;
 const inner=(nearRadius+.42)*chunk;
 function sample(x,z){
   const s=world.sample(centerX+x,centerZ+z);
   color.setHex(world.era<120?0x86584e:
     !s.land?(rgb[s.waterKind]||rgb.ocean):
     world.era<870?0xa99982:rgb[s.biome]||rgb.grassland);
   // Atmospheric horizon fade remains visible even with scene fog disabled.
   const d=Math.max(Math.abs(x),Math.abs(z));
   const fade=Math.max(0,Math.min(1,
     (d-outerRadius*.71)/(outerRadius*.29)));
   color.lerp(sky,fade*.94);
   return {x,y:s.height-.38,z,r:color.r,g:color.g,b:color.b};
 }
 function triangle(a,b,c){
   for(const p of [a,b,c]){
     verts.push(p.x,p.y,p.z);colors.push(p.r,p.g,p.b);
   }
   tris++;
 }
 for(let x=-outerRadius;x<outerRadius;x+=step){
   for(let z=-outerRadius;z<outerRadius;z+=step){
     const d=Math.max(Math.abs(x+step*.5),Math.abs(z+step*.5));
     if(d<inner||d>outerRadius)continue;
     const a=sample(x,z),b=sample(x+step,z),c=sample(x,z+step),
       d1=sample(x+step,z+step);
     triangle(a,c,b);triangle(b,c,d1);
   }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));
 geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
 geometry.computeVertexNormals();
 const material=new THREE.MeshLambertMaterial({
   vertexColors:true,side:THREE.DoubleSide,depthWrite:true
 });
 const mesh=new THREE.Mesh(geometry,material);
 mesh.position.set(centerX,0,centerZ);
 mesh.userData.horizonTriangles=tris;
 mesh.userData.sharedGeometry=false;
 mesh.receiveShadow=false;
 mesh.frustumCulled=false;
 return mesh;
}
