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
 const species=a.species,root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const biped=["theropod","spinosaurus","hadrosaur"].includes(species);
 const long=species==="sauropod";
 const crest=species==="triceratops",armored=species==="ankylosaur";
 const skin={
   sauropod:0x819487,stegosaur:0x7c966e,theropod:0x93735b,
   spinosaurus:0x79948e,triceratops:0x8c9270,ankylosaur:0x927e64,
   hadrosaur:0x9a9273
 }[species]||0x918774;
 const y=armored?1.16:1.55;
 part(body,"orb",skin,0,y,0,armored?.94:.72,armored?.56:.62,long?1.33:1.08);
 if(armored)for(let i=0;i<16;i++){
   const row=Math.floor(i/8),index=i%8;
   part(body,"cone",0x675b4c,(row===0?-.58:.58),1.62,-.8+index*.22,
     .20,.46,.21,0,0,(row===0?-.3:.3));
 }
 const neck=new THREE.Group();neck.position.set(0,y+.12,.63);body.add(neck);
 part(neck,"leg",skin,0,long?1.13:.24,long?.95:.35,
   long?.30:.40,long?2.80:.90,long?.28:.39,long?Math.PI/3:.46);
 const head=new THREE.Group();head.position.set(0,long?2.27:.56,long?1.8:.78);neck.add(head);
 part(head,"orb",skin,0,0,0,long?.34:crest?.59:.42,.34,long?.45:.51);
 if(crest){
   part(head,"orb",0xd9d0af,0,.31,-.30,.88,.72,.19);
   part(head,"cone",0xe6dfc6,0,.13,.47,.21,.88,.20,Math.PI/2);
   for(const side of [-1,1])
     part(head,"cone",0xd9d1ba,side*.37,.38,.49,.16,1.05,.16,Math.PI/2.7,0,side*.2);
   part(head,"low",0xd5c9a6,0,-.23,.49,.30,.18,.35);
 }else if(armored){
   part(head,"box",skin,0,-.17,.37,.55,.28,.67);
   for(const side of [-1,1])part(head,"cone",0x79684e,side*.49,.04,.23,.23,.60,.20,0,0,side*.7);
 }else if(species==="hadrosaur"){
   part(head,"orb",0xbeb38e,0,-.18,.36,.35,.27,.42);
   part(head,"cone",0x947455,0,.50,-.15,.21,.80,.18,0,0,-.40);
 }else{
   const predator=["theropod","spinosaurus"].includes(species);
   part(head,"box",predator?0xb0a187:0xc0b9a2,0,-.22,.43,.38,.21,
     predator?.69:.40);
   for(const side of [-1,1]){
     if(predator)for(let i=0;i<4;i++)
       part(head,"cone",0xe9e0c9,side*.29,-.39,.46+i*.13,.07,.20,.09,0,0,Math.PI);
   }
   if(predator)part(head,"box",0x50453d,0,-.46,.52,.33,.07,.58);
 }
 for(const side of [-1,1])part(head,"eye",0x212821,side*(crest?.41:.30),.12,.39,.085,.085,.055);
 const tail=new THREE.Group();tail.position.set(0,y,-1.05);body.add(tail);
 part(tail,"cone",skin,0,0,-1.00,.46,2.55,.44,-Math.PI/2);
 if(species==="stegosaur")for(let i=0;i<7;i++){
   part(body,"low",0xccae7e,0,y+.48,-.85+i*.28,.20,.56,.35,0,0,i%2?.24:-.24);
 }
 if(species==="spinosaurus")for(let i=0;i<8;i++){
   const z=-.7+i*.25,h=(1.1+1.3*Math.sin(i/7*Math.PI));
   part(body,"cone",0xa36c5e,0,y+.41+h*.38,z,.20,h,.18);
 }
 if(armored){
   part(tail,"orb",0x796550,0,-.07,-2.18,.45,.40,.52);
   for(const side of [-1,1])part(tail,"cone",0x7d6d54,side*.33,.1,-2.14,.13,.43,.13,0,0,side*.5);
 }
 const legs=[];
 if(biped){
   for(const side of [-1,1]){
     legs.push(limb(body,side*.45,1.31,-.43,skin,1.16));
     if(species!=="hadrosaur"){
       const arm=limb(body,side*.5,1.72,.49,skin,.43,false);
       arm.rotation.x=.4;
     }
   }
 }else for(const zz of [-.70,.79])for(const side of [-1,1])
   legs.push(limb(body,side*.56,1.20,zz,skin,1.03));
 root.userData={legs,head,body,tail,modelFamily:species};
 return root;
}
function flying(a){
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const species=a.species,insect=["butterfly","giantDragonfly"].includes(species);
 const pt=species==="pterosaur",penguin=species==="penguin";
 const colors={pterosaur:0x988470,earlyBird:0xb4a18b,eagle:0x785e4a,
  waterfowl:0xd5d5c5,owl:0xa38662,parrot:0x46a77d,flamingo:0xee9ba3,
  penguin:0x282e38,seabird:0xd1d9dc,stork:0xf0e1cf,
  butterfly:0xc58a4d,giantDragonfly:0x57b6ac};
 const fur=colors[species]||0x98959b;
 if(insect){
   part(body,"orb",fur,0,.34,0,.14,.16,.72);
   part(body,"orb",0x263e41,0,.43,.57,.23,.24,.26);
   for(const side of [-1,1]){
     part(body,"eye",0x53aeb5,side*.18,.49,.72,.15,.16,.12);
     part(body,"cone",0x304849,side*.08,.85,.66,.03,.49,.03);
   }
 }else{
   part(body,"orb",fur,0,.38,0,penguin?.47:.39,penguin?.66:.34,pt?.82:.68);
   if(penguin)part(body,"orb",0xe5e7e0,0,.35,.38,.35,.54,.29);
   if(species==="owl"){
     part(body,"orb",0xdfc9a0,0,.71,.40,.36,.37,.29);
     for(const side of [-1,1]){
       part(body,"orb",0xeee2c0,side*.18,.78,.68,.18,.19,.10);
       part(body,"eye",0xe5a443,side*.18,.78,.78,.10,.12,.05);
       part(body,"eye",0x262520,side*.18,.78,.82,.047,.060,.035);
       part(body,"cone",fur,side*.29,1.02,.37,.16,.33,.14,0,0,side*.22);
     }
   }else{
     const neck=["flamingo","stork"].includes(species),length=species==="flamingo"?1.5:species==="stork"?1.2:.40;
     if(neck)part(body,"leg",fur,0,.75,.40,.20,length,.18,.12);
     const hy=neck?1.12+.4*(length-.9):.68;
     part(body,"orb",fur,0,hy,.45,.27,.30,.28);
     for(const side of [-1,1])part(body,"eye",0x1e2629,side*.23,hy+.07,.64,.072,.085,.045);
   }
   const beakY=species==="flamingo"?1.47:species==="stork"?1.33:.64;
   const long=["stork","pterosaur"].includes(species),hook=["eagle","parrot"].includes(species);
   const bill=species==="parrot"?0xc9a044:species==="flamingo"?0x2c3337:0xd3a452;
   const length=long?.75:species==="flamingo"?.57:hook?.42:penguin?.35:.34;
   part(body,"cone",bill,0,beakY,.87,.17,length,.15,Math.PI/2);
   if(hook)part(body,"cone",bill,0,beakY-.13,1.12,.13,.24,.12,Math.PI);
   if(species==="waterfowl")part(body,"box",0xd7a857,0,.61,1.04,.30,.07,.35);
   if(pt)part(body,"cone",0x9f856b,0,1.04,.30,.17,.70,.16,0,0,.20);
 }
 const wings=[];
 for(const side of [-1,1]){
   const wing=new THREE.Group();wing.position.set(side*(insect?.15:.35),.48,0);
   body.add(wing);
   if(insect){
     const dragon=species==="giantDragonfly";
     const base=dragon?0x96d9dc:side===-1?0xf2a95c:0xdd7245;
     for(let j=0;j<(dragon?2:2);j++){
       const dx=(j===0?1:-1);
       part(wing,"orb",base,side*(dragon?1.0:.86),0,dx*(dragon?.29:.38),
         dragon?.96:.83,.042,dragon?.23:.48,0,0,side*(dragon?.09:.29));
       if(!dragon)part(wing,"orb",0x77544c,side*1.18,.02,dx*.42,.19,.044,.16);
     }
   }else{
     part(wing,"box",fur,side*(penguin?.29:.64),0,-.08,penguin?.60:1.30,
       penguin?.14:.08,pt?.60:.38,0,0,side*(penguin?.5:0));
     if(!penguin){
       for(let i=0;i<4;i++)part(wing,"cone",pt?0xbba08a:0xb7b6aa,
         side*(.48+i*.28),0,-.2,.25,.56+.11*i,.15,0,Math.PI/2);
     }
   }
   wings.push(wing);
 }
 const tail=new THREE.Group();tail.position.set(0,.36,-.62);body.add(tail);
 part(tail,"cone",insect?fur:penguin?0x282e38:0xc4b8a5,0,0,-.44,
   insect?.12:.31,insect?.89:.85,.23,-Math.PI/2);
 if(["flamingo","stork"].includes(species)){
   for(const side of [-1,1]){
     part(body,"leg",species==="flamingo"?0xada19a:0x866b59,
       side*.13,-.43,-.10,.065,1.48,.065);
   }
 }
 root.userData={wings,body,tail,modelFamily:species};
 return root;
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
   ["sauropod","stegosaur","theropod","triceratops","ankylosaur",
     "hadrosaur","spinosaurus"].includes(spec)?dinosaur(a):
   a.type==="bird"?flying(a):createLandAnimal(a);
 root.userData.agentId=a.id;
 root.scale.setScalar(Math.max(.35,Math.min(3.6,(a.size||1)*.78)));
 root.traverse(o=>{if(o.isMesh)o.userData.agentId=a.id});
 return root;
}
