// Small low-poly landmarks on close terrain tiles only. All landmarks sample the
// canonical geographic map, and are removed when their terrain tile unloads.
import * as THREE from "three";
import {classifyPhysicalFeature} from "./physical-features.js";
const COLORS={rock:0x888a86,shadow:0x27343b,sand:0xc8ae79,ice:0xb5d8e8,
  coral:0xea8b75,foam:0xd5eff1,basalt:0x5d6465,vegetation:0x5a886b};
const material=new Map();
const mats=(key)=>{
 if(!material.has(key))material.set(key,
   new THREE.MeshStandardMaterial({color:COLORS[key],roughness:.9,flatShading:true,
     transparent:key==="foam",opacity:key==="foam"?.77:1}));
 return material.get(key);
};
function obj(parent,geometry,key,x,y,z,rotation=0){
 const mesh=new THREE.Mesh(geometry,mats(key));mesh.position.set(x,y,z);
 mesh.rotation.y=rotation;mesh.castShadow=true;mesh.userData.sharedMaterial=true;
 parent.add(mesh);return mesh;
}
export function createLandformLandmarks(world,cx,cz,size){
 const group=new THREE.Group(),seed=world.seed;
 let count=0;
 for(let i=0;i<7;i++){
   const fx=((Math.sin(cx*41.13+cz*19.71+i*11.31+seed)*4719)%1+1)%1;
   const fz=((Math.sin(cx*13.51+cz*61.73+i*7.81+seed*.11)*1929)%1+1)%1;
   const x=(cx+fx)*size,z=(cz+fz)*size,s=world.sample(x,z);
   const form=classifyPhysicalFeature(s).name;
   const py=s.height;
   const angle=i*1.618;
   if(count>=3)break;
   if(["volcano","crater"].includes(form)&&s.land){
     // The mountain-sized volcanic cone and summit crater come from geography.js.
     // Only place small surface rocks here; a fake mini-cone would float above
     // the real terrain and make the volcano appear toy-sized.
     for(let j=0;j<3;j++){
       const px=x+Math.cos(angle+j*2.09)*1.4,pz=z+Math.sin(angle+j*2.09)*1.4;
       obj(group,new THREE.DodecahedronGeometry(.33+j*.12,0),"basalt",
         px,world.height(px,pz)+.14,pz,angle+j);
     }
     count++;
   }else if(["cave entrance","cliff","gorge","canyon"].includes(form)&&s.land){
     obj(group,new THREE.DodecahedronGeometry(2.2,0),"rock",x,py+1.05,z);
     obj(group,new THREE.SphereGeometry(.86,7,5),"shadow",x,py+.55,z+1.75).scale.set(1.2,.82,.28);
     count++;
   }else if(["glacier","glacial inlet"].includes(form)){
     obj(group,new THREE.ConeGeometry(2.4,4.3,5),"ice",x,py+1.15,z,angle);
     count++;
   }else if(["reef","lagoon"].includes(form)){
     for(let j=0;j<4;j++)
       obj(group,new THREE.DodecahedronGeometry(.45+j*.06,0),"coral",
         x+Math.cos(j*2.4)*.9,py+.35,z+Math.sin(j*2.4)*.9);
     count++;
   }else if(["waterfall"].includes(form)){
     obj(group,new THREE.PlaneGeometry(1.3,2.9),"foam",x,py+.80,z,angle);
     count++;
   }else if(["dune","desert","mesa"].includes(form)&&s.land){
     const mound=obj(group,new THREE.DodecahedronGeometry(2.4,0),"sand",
       x,py+.35,z,angle);
     mound.scale.set(1.4,.32,.8);count++;
   }
 }
 return group;
}
