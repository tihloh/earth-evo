// Era-dependent procedural low-poly creatures. The +Z axis is forward for all forms.
// These meshes approximate anatomical groups; they are not taxonomically exact reconstructions.
import * as THREE from "three";
import {createLandAnimal} from "./animal-anatomy.js";
const materials=new Map();
const mat=(hex)=>{if(!materials.has(hex))materials.set(hex,
  new THREE.MeshStandardMaterial({color:hex,roughness:.9,flatShading:true}));
  return materials.get(hex)};
const geo={
  orb:new THREE.IcosahedronGeometry(1,1),low:new THREE.IcosahedronGeometry(1,0),
  box:new THREE.BoxGeometry(1,1,1),leg:new THREE.CylinderGeometry(.48,.57,1,6),
  cone:new THREE.ConeGeometry(.5,1,6),beak:new THREE.ConeGeometry(.5,1,4),
  eye:new THREE.SphereGeometry(1,6,5),torus:new THREE.TorusGeometry(1,.17,5,16),
  disk:new THREE.CylinderGeometry(1,1,.15,12)
};
function part(parent,shape,tint,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0){
 const m=new THREE.Mesh(geo[shape],mat(tint));parent.add(m);m.position.set(x,y,z);
 m.scale.set(sx,sy,sz);m.rotation.set(rx,ry,rz);
 m.castShadow=shape!=="eye";m.userData.sharedGeometry=true;m.userData.sharedMaterial=true;
 return m;
}
function limb(body,x,y,z,color,length=.85,leg=true){
 const pivot=new THREE.Group();pivot.position.set(x,y,z);body.add(pivot);
 part(pivot,"leg",color,0,-length*.5,0,.22,length,.22);
 part(pivot,"box",leg?0x403c36:color,0,-length+.01,.10,.25,.18,.34);
 return pivot;
}
function eyes(head,sideX=.32,y=.09,z=.50){
 for(const side of [-1,1]){
   part(head,"eye",0x182020,side*sideX,y,z,.07,.07,.045);
   part(head,"eye",0xf7f7e8,side*sideX-.016,y+.03,z+.035,.021,.021,.02);
 }
}
function dinosaur(a){
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const species=a.species,herb=species!=="theropod";
 const tint=species==="stegosaur"?0x78926a:species==="sauropod"?0x80968c:0x96745b;
 part(body,"orb",tint,0,1.6,0,.71,.69,1.20);
 const neck=new THREE.Group();neck.position.set(0,1.61,.65);body.add(neck);
 const long=species==="sauropod";
 part(neck,"leg",tint,0,long?.83:.35,long?.75:.40,
  long?.35:.35,long?2.7:1.1,long?.34:.35,long?Math.PI/3:.43);
 const head=new THREE.Group();head.position.set(0,long?2.05:.69,long?1.6:.70);neck.add(head);
 part(head,"orb",tint,0,0,.1,long?.29:.53,.31,.48);
 part(head,"low",herb?0xa9a688:0xd2b18d,0,-.20,.46,.42,.19,.40);
 eyes(head,.26,.07,.5);
 const tail=new THREE.Group();tail.position.set(0,1.6,-1);body.add(tail);
 part(tail,"cone",tint,0,.06,-1,.43,2.65,.42,Math.PI/2);
 if(species==="stegosaur"){
   for(let i=0;i<6;i++){
     const z=.8-i*.38;
     part(body,"low",0xbe986a,0,2.15+i*.06,z,.17,.59,.39,0,0,.3);
   }
   for(const side of [-1,1])part(tail,"cone",0x866b4f,side*.27,.3,-1.85,.11,.75,.11,Math.PI/2);
 }
 const legs=[];
 if(species==="theropod"){
   for(const side of [-1,1]){
     legs.push(limb(body,side*.48,1.35,-.33,tint,1.20));
     const arm=limb(body,side*.50,1.78,.57,tint,.46,false);
     arm.rotation.x=.7;
   }
   body.rotation.x=-.06;
 }else{
   for(const z of [-.67,.76])for(const side of [-1,1])
     legs.push(limb(body,side*.50,1.20,z,tint,1.10));
 }
 root.userData={legs,head,body,tail};
 return root;
}
function flying(a){
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const species=a.species,pt=species==="pterosaur";
 const feather=pt?0x917a65:species==="eagle"?0x795d48:species==="waterfowl"?0xc1d0b6:
   species==="earlyBird"?0x927d68:0x8b9897;
 part(body,"orb",feather,0,.33,0,.39,.33,pt?.8:.65);
 part(body,"orb",feather,0,.62,.48,.29,.29,.30);
 part(body,"cone",pt?0xae9a77:0xdaa34d,0,.56,.85,.16,pt?.62:.35,.16,Math.PI/2);
 eyes(body,.22,.69,.67);
 const wings=[];
 for(const side of [-1,1]){
   const wing=new THREE.Group();wing.position.set(side*.31,.47,0);body.add(wing);
   part(wing,"box",feather,side*.58,0,-.05,1.23,.10,pt?.65:.38);
   if(pt){
     part(wing,"cone",0xad9276,side*1.2,0,-.10,.50,1.50,.30,0,0,-side*Math.PI/2);
   }else for(let i=0;i<4;i++){
     part(wing,"cone",0xaaa292,side*(.35+i*.29),0,-.21,.26,.55+(4-i)*.10,.14,0,Math.PI/2);
   }
   wings.push(wing);
 }
 const tail=new THREE.Group();tail.position.set(0,.31,-.58);body.add(tail);
 part(tail,"cone",feather,0,0,-.47,.30,.9,.24,-Math.PI/2);
 root.userData={body,wings,tail};return root;
}
function marine(a){
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const species=a.species,base=species==="trilobite"?0x807c63:
   species==="ammonoid"?0x97866f:0x54879b;
 if(species==="ammonoid"){
   part(body,"orb",base,0,.40,0,.74,.68,.34);
   part(body,"torus",0xd8c6a2,0,.4,.36,.55,.50,.48);
   for(let i=0;i<6;i++)part(body,"cone",0xab9071,Math.sin(i)*.25,.3,.45,
     .10,.32,.10,Math.PI/2);
 }else if(species==="trilobite"){
   part(body,"orb",base,0,.24,0,.50,.18,.92);
   for(let i=0;i<8;i++){
     const z=-.67+i*.18;
     part(body,"box",i%2?0xb1a88c:base,0,.35,z,.8,.13,.12);
   }
   part(body,"orb",base,0,.30,.73,.42,.22,.31);
   for(const side of [-1,1])part(body,"eye",0x222222,side*.27,.46,.80,.05,.04,.03);
 }else{
   part(body,"orb",base,0,.38,0,.40,.41,1.05);
   part(body,"cone",base,0,.39,-1.18,.46,.95,.26,Math.PI/2);
   part(body,"cone",0x6998a4,0,.79,-.15,.13,.55,.40);
   for(const side of [-1,1]){
     part(body,"cone",0x82acb7,side*.40,.36,.1,.12,.50,.28,0,0,side*.7);
     part(body,"eye",0xf7e6ca,side*.34,.53,.65,.09,.09,.05);
     part(body,"eye",0x202831,side*.35,.54,.69,.04,.04,.025);
   }
 }
 root.userData={body,tail:body};return root;
}
function human(a){
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const period=a.style?.period||"contemporary",outfit=a.style?.outfit||"shirt-and-trousers";
 const skin=[0xc99672,0x85604a,0xb5805d,0xe3bb93][a.id%4];
 const hair=[0x332722,0x554238,0x272e30,0x72513d][a.id%4];
 const early=period==="early-hominin",farm=period==="early-farming";
 const historic=period==="historic",industrial=period==="industrial",future=period==="speculative";
 const cold=/fur|layered|jacket|coat/.test(outfit);
 const cloth=early?0x927454:farm?0xa78e66:historic?0xb68c68:
   industrial?0x504b48:future?0x547989:[0x557d85,0x8c6557,0x697a60][a.id%3];
 const pants=early?skin:farm?0xa18d77:historic?0x83715b:industrial?0x434348:
   future?0x273e4d:0x444f58;
 part(body,"leg",cloth,0,1.42,0,.58,early?.69:.95,.41);
 if(cold)part(body,"orb",0xb4a893,0,1.44,0,.59,.49,.44);
 if(future)part(body,"box",0x324d60,0,1.41,.42,.48,.62,.10);
 const head=new THREE.Group();head.position.set(0,2.15,0);body.add(head);
 part(head,"orb",skin,0,0,.05,.33,.37,.34);
 part(head,"orb",hair,0,.29,-.03,.35,.16,.36);
 part(head,"low",skin,0,-.08,.36,.12,.14,.12);
 for(const side of [-1,1]){
   part(head,"eye",0x222828,side*.15,.08,.35,.042,.041,.03);
   part(head,"low",skin,side*.35,.01,0,.07,.13,.09);
 }
 part(head,"box",0x965d51,0,-.15,.39,.12,.015,.02);
 if(early)part(head,"orb",0x77523f,0,.22,-.07,.36,.17,.31);
 const arms=[],legs=[];
 for(const side of [-1,1]){
   const arm=new THREE.Group();arm.position.set(side*.54,1.76,0);body.add(arm);
   part(arm,"leg",early?skin:cloth,0,-.31,0,.18,.61,.19);
   part(arm,"orb",skin,0,-.64,.05,.14,.17,.15);arms.push(arm);
   const leg=new THREE.Group();leg.position.set(side*.23,.84,0);body.add(leg);
   part(leg,"leg",pants,0,-.33,0,.20,.64,.21);
   if(!early)part(leg,"box",future?0x263643:0x504139,0,-.69,.10,.23,.16,.32);
   legs.push(leg);
 }
 if(farm||historic){
   part(body,"box",0x7b6849,0,1.16,.44,.61,.08,.10);
   if(cold)part(body,"orb",0x9b846b,0,1.78,-.24,.65,.32,.45);
 }else if(industrial){
   part(body,"box",0x6a6056,0,1.33,.39,.38,.64,.08);
   part(head,"cone",0x484340,0,.49,0,.49,.45,.48);
 }else if(future){
   for(const side of [-1,1])part(body,"box",0xb9c7cb,side*.56,1.79,0,.16,.18,.35);
   part(head,"orb",0xaac5d1,0,.02,.31,.37,.30,.12);
 }
 root.userData={legs,arms,head,body};return root;
}
export function createCreatureModel(a){
 const spec=a.species||"deer";
 const root=a.type==="human"?human(a):a.type==="marine"?marine(a):
   ["sauropod","stegosaur","theropod"].includes(spec)?dinosaur(a):
   a.type==="bird"?flying(a):createLandAnimal(a);
 root.userData.agentId=a.id;
 root.scale.setScalar(Math.max(.35,Math.min(3.6,(a.size||1)*.78)));
 root.traverse(o=>{if(o.isMesh)o.userData.agentId=a.id});
 return root;
}
