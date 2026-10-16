// Individually sculpted land-animal faces and silhouettes.
// Every type faces local +Z. Shared geometry/materials keep GPU allocations bounded.
import * as THREE from "three";
import {LAND_FORMS} from "./animal-families.js";

const cache=new Map(),g={
  oval:new THREE.IcosahedronGeometry(1,1),
  facet:new THREE.IcosahedronGeometry(1,0),
  round:new THREE.SphereGeometry(1,9,6),
  cube:new THREE.BoxGeometry(1,1,1),
  cone:new THREE.ConeGeometry(1,1,7),
  ear:new THREE.ConeGeometry(1,1,4),
  trunk:new THREE.CylinderGeometry(.66,1,1,7),
  horn:new THREE.ConeGeometry(.45,1,7),
  ring:new THREE.TorusGeometry(1,.13,5,14)
};
const colors={
 canid:0x817d72,fox:0xc47b3c,lion:0xc69c5a,tiger:0xc27b3d,
 leopard:0xd4b778,bear:0x735c4b,deer:0xb58e66,bison:0x594131,
 rabbit:0xc0b2a0,mammoth:0x755b45,elephant:0x90958e,
 boar:0x67594a,pig:0xc98e8e,horse:0x9a7151,zebra:0xe3dfd3,
 cattle:0x977c63,sheep:0xdad3ba,goat:0xaea28b,camel:0xc3a16e,
 giraffe:0xd4ad69,rhino:0x82847f,hippo:0x8c858b,kangaroo:0xae8667,
 primate:0x56544d,tortoise:0x728b5e,crocodile:0x607b60,snake:0x77905f,
 lizard:0x73956c,frog:0x5c997a,salamander:0x847a55,synapsid:0x857856
};
function mat(hex){if(!cache.has(hex))cache.set(hex,new THREE.MeshStandardMaterial({
 color:hex,roughness:.95,flatShading:true}));return cache.get(hex)}
function p(parent,shape,hex,x,y,z,w=1,h=1,d=1,rx=0,ry=0,rz=0){
 const m=new THREE.Mesh(g[shape],mat(hex));parent.add(m);
 m.position.set(x,y,z);m.scale.set(w,h,d);m.rotation.set(rx,ry,rz);
 m.castShadow=shape!=="round"&&shape!=="ring";
 m.userData.sharedGeometry=true;m.userData.sharedMaterial=true;
 return m;
}
const bodyInfo={
 giraffe:[.43,.49,.88,2.1],elephant:[.9,.84,1.30,1.58],
 mammoth:[.98,.92,1.26,1.65],rhino:[.91,.75,1.17,1.42],
 hippo:[.92,.64,1.22,1.17],bison:[.78,.74,1.06,1.41],
 bear:[.74,.71,1.0,1.30],kangaroo:[.49,.77,.75,1.55],
 rabbit:[.43,.37,.62,.63],fox:[.4,.39,.76,.95],
 primate:[.77,.75,.63,1.43],camel:[.56,.65,1.15,1.55],
 tortoise:[.76,.38,.90,.63],crocodile:[.76,.32,1.53,.55],
 snake:[.19,.19,1.1,.39],lizard:[.39,.29,.82,.53],
 frog:[.51,.28,.54,.44],salamander:[.40,.23,.92,.38]
};
const pale=0xe4dac7,ink=0x1f2727;
function eye(head,x,y,z,iris=ink,size=.073){
  for(const side of [-1,1]){
    p(head,"round",pale,side*x,y,z,size*1.25,size*1.2,size*.7);
    p(head,"round",iris,side*x,y,z+size*.55,size*.55,size*.69,size*.34);
  }
}
function nose(head,hex,z,w=.16,y=-.17){
 p(head,"facet",hex,0,y,z,w,.10,w*.76);
 for(const side of [-1,1])p(head,"round",ink,side*w*.49,y+.012,z+w*.50,.031,.027,.019);
}
function ears(head,hex,mode="point",x=.37,y=.46){
 for(const side of [-1,1]){
   if(mode==="round")p(head,"oval",hex,side*x,y,.02,.19,.20,.14);
   else if(mode==="flop")p(head,"oval",hex,side*(x+.10),y-.05,.06,.31,.12,.19,0,0,side*.38);
   else p(head,"ear",hex,side*x,y,0,.19,.38,.18,0,0,side*.18);
 }
}
function hoofLeg(body,x,y,z,hex,len,foot,bulk=.18){
 const pivot=new THREE.Group();pivot.position.set(x,y,z);body.add(pivot);
 p(pivot,"trunk",hex,0,-len*.49,0,bulk,len*.97,bulk);
 p(pivot,"cube",foot,0,-len+.01,.13,bulk*1.25,.16,.29);
 return pivot;
}
function herbivoreFace(head,form,fur){
 if(form==="deer"){
   p(head,"oval",fur,0,-.15,.36,.25,.23,.53);
   nose(head,0x423b34,.79,.15,-.25);ears(head,fur,"flop",.34,.30);eye(head,.245,.13,.28);
   for(const side of [-1,1]){
     p(head,"horn",0x725338,side*.25,.75,-.12,.09,.96,.09,0,0,side*.17);
     p(head,"horn",0x725338,side*.49,.80,.02,.07,.48,.08,0,0,side*.43);
   }
 }else if(["horse","zebra"].includes(form)){
   p(head,"oval",fur,0,-.26,.39,.33,.49,.43);
   p(head,"oval",0xbdb0a2,0,-.56,.67,.33,.20,.30);nose(head,0x4a4240,.82,.27,-.59);
   ears(head,fur,"point",.29,.52);eye(head,.29,.12,.25);
   p(head,"cone",form==="zebra"?0x292e31:0x4e392f,0,.43,-.22,.25,.71,.18,.55);
   if(form==="zebra")for(let i=0;i<3;i++)p(head,"cube",0x343331,0,.04-i*.17,.40+i*.06,.27,.044,.045);
 }else if(["bison","cattle","goat","sheep"].includes(form)){
   const sheep=form==="sheep",goat=form==="goat";
   p(head,"cube",fur,0,-.16,.25,.43,.34,.50);
   p(head,"oval",sheep?0x7c6b60:goat?0x8a806f:0xc6ada1,0,-.30,.66,.39,.22,.30);
   nose(head,0x6b5350,.88,.20,-.31);eye(head,.32,.08,.44);
   ears(head,fur,"flop",.39,.32);
   for(const side of [-1,1]){
     const horn=goat?0x7b6d5e:0xe0d6bd;
     p(head,"horn",horn,side*.41,.64,-.11,.12,goat?.80:.52,.12,0,0,side*(goat?-.32:.46));
   }
   if(goat)p(head,"cone",0x655347,0,-.55,.62,.11,.36,.12);
   if(sheep)for(let i=0;i<5;i++)p(head,"facet",pale,Math.cos(i*1.26)*.34,.47,Math.sin(i*1.26)*.26,.23,.24,.23);
 }else if(form==="giraffe"){
   p(head,"oval",fur,0,-.11,.26,.28,.27,.50);
   p(head,"cube",0xd7b89a,0,-.18,.64,.27,.20,.30);nose(head,0x776757,.82,.20,-.24);
   ears(head,fur,"flop",.30,.23);eye(head,.25,.09,.39);
   for(const side of [-1,1])p(head,"horn",fur,side*.18,.57,-.1,.085,.58,.085);
 }else if(form==="camel"){
   p(head,"oval",fur,0,-.16,.34,.27,.25,.48);
   p(head,"oval",0xd7b894,0,-.37,.62,.30,.18,.40);
   p(head,"facet",0x775746,0,-.43,.91,.24,.10,.16);nose(head,0x694d3d,.91,.20,-.39);
   eye(head,.22,.08,.40);ears(head,fur,"point",.31,.38);
 }else if(form==="rhino"){
   p(head,"cube",fur,0,-.12,.31,.51,.39,.53);
   p(head,"oval",0x95988b,0,-.33,.67,.42,.24,.36);
   p(head,"horn",0xc8bda1,0,.17,.71,.18,.84,.18,0,0,Math.PI/2);
   p(head,"horn",0xb2aa90,0,.27,.37,.13,.43,.14,0,0,Math.PI/2);
   eye(head,.39,.16,.37);ears(head,fur,"point",.40,.43);
 }else if(form==="hippo"){
   p(head,"cube",fur,0,-.23,.32,.52,.43,.48);
   p(head,"cube",0x989199,0,-.37,.82,.63,.35,.50);
   eye(head,.36,.33,.31);ears(head,fur,"round",.43,.48);
   for(const side of [-1,1])p(head,"round",0x403b42,side*.36,-.20,1.30,.095,.065,.043);
   p(head,"cube",0x453b3e,0,-.64,.83,.50,.05,.39);
 }else if(["elephant","mammoth"].includes(form)){
   p(head,"oval",fur,0,-.08,.10,.75,.65,.63);
   for(const side of [-1,1]){
     p(head,"oval",form==="mammoth"?0x75614e:0xa0a59d,side*.70,-.08,.0,.41,.61,.20,0,0,side*.16);
     p(head,"horn",0xf0e2c7,side*.32,-.46,.66,.16,1.05,.14,1.10,0,side*.15);
   }
   const trunk=new THREE.Group();head.add(trunk);trunk.position.set(0,-.24,.54);
   p(trunk,"trunk",fur,0,-.26,.20,.27,.72,.26,.68);
   p(trunk,"trunk",fur,0,-.78,.52,.19,.55,.20,.23);
   eye(head,.41,.25,.59);
 }else if(form==="kangaroo"){
   p(head,"oval",fur,0,-.17,.28,.27,.29,.42);
   p(head,"oval",pale,0,-.25,.58,.20,.18,.31);nose(head,0x55453f,.81,.11,-.27);
   ears(head,fur,"point",.29,.56);eye(head,.25,.12,.34);
 }else if(["pig","boar"].includes(form)){
   p(head,"oval",fur,0,-.15,.24,.44,.33,.49);
   p(head,"cube",form==="boar"?0x64534a:0xdcaaa8,0,-.24,.68,.39,.26,.30);
   p(head,"oval",0xe7aba0,0,-.25,.95,.34,.20,.10);
   for(const side of [-1,1]){
     p(head,"round",0x6d4448,side*.15,-.25,1.04,.068,.07,.031);
     if(form==="boar")p(head,"horn",pale,side*.40,-.31,.72,.12,.42,.10,0,0,side*.34);
   }
   ears(head,fur,"flop",.45,.49);eye(head,.33,.13,.39);
 }else if(form==="rabbit"){
   p(head,"oval",fur,0,-.05,.28,.35,.32,.38);
   p(head,"oval",pale,0,-.24,.49,.24,.16,.30);
   for(const side of [-1,1]){
     p(head,"oval",fur,side*.22,.83,-.06,.16,.74,.14,0,0,side*.12);
     p(head,"oval",0xc99d9f,side*.22,.87,.06,.085,.54,.06,0,0,side*.12);
   }
   eye(head,.28,.11,.38,0x25232a,.115);nose(head,0xd2a1a2,.73,.12,-.13);
 }
}
function carnivoreFace(head,form,fur){
 if(["canid","fox"].includes(form)){
   const fox=form==="fox";
   p(head,"oval",fox?pale:fur,0,-.21,.47,fox?.25:.28,.20,fox?.62:.48);
   p(head,"oval",fox?pale:0xc5b9a5,0,-.20,.77,.18,.12,.20);
   nose(head,ink,.98,.13,-.16);eye(head,.25,.15,.40,0x242527,.088);
   for(const side of [-1,1]){
     p(head,"ear",fur,side*.34,.57,-.04,fox?.34:.27,fox?.58:.43,.19,0,0,side*.12);
     p(head,"ear",0x9e696b,side*.34,.59,.09,.13,fox?.37:.28,.09);
   }
 }else if(["lion","tiger","leopard"].includes(form)){
   if(form==="lion")p(head,"oval",0x835732,0,.04,-.18,.62,.64,.46);
   p(head,"oval",fur,0,-.12,.21,.47,.41,.47);
   p(head,"oval",pale,0,-.26,.56,.38,.19,.27);
   p(head,"facet",0x6b514a,0,-.19,.81,.19,.12,.14);
   eye(head,.30,.17,.46,0x755e25,.084);
   ears(head,form==="lion"?0x855d39:fur,"round",.41,.36);
   for(const side of [-1,1])for(let j=0;j<3;j++){
     p(head,"cone",0x5b4c3e,side*(.24+j*.09),-.32+j*.045,.77,.018,.33,.018,Math.PI/2);
   }
   if(form==="tiger"){
     for(const side of [-1,1])for(let i=0;i<3;i++)
       p(head,"cube",0x332e2d,side*.34,.18-i*.17,.33,.09,.085,.035,0,0,side*.25);
   }
   if(form==="leopard"){
     for(const side of [-1,1])for(let i=0;i<3;i++)
       p(head,"facet",0x493a28,side*(.29+(i%2)*.12),.21-i*.18,.35,.065,.06,.033);
   }
 }else if(form==="bear"){
   p(head,"oval",fur,0,-.06,.22,.57,.49,.49);
   ears(head,fur,"round",.45,.43);
   p(head,"oval",0xbca892,0,-.22,.62,.39,.25,.36);
   nose(head,ink,.93,.24,-.11);eye(head,.32,.19,.52,0x1f2527,.078);
 }
}
function reptileFace(head,form,fur){
 if(form==="frog"||form==="salamander"){
   p(head,"oval",fur,0,-.17,.4,.58,.25,.58);
   for(const side of [-1,1]){
     p(head,"orb" in g?"orb":"oval",fur,side*.41,.24,.45,.19,.24,.19);
     p(head,"round",0xd2b27a,side*.41,.29,.60,.12,.12,.09);
     p(head,"round",ink,side*.41,.30,.68,.052,.06,.03);
   }
   p(head,"cube",0x405e4b,0,-.39,.68,.40,.018,.35);
 }else if(form==="crocodile"){
   p(head,"cube",fur,0,-.19,.58,.68,.25,1.05);
   p(head,"cube",0xa7af84,0,-.44,.65,.65,.09,.98);
   for(const side of [-1,1]){
     p(head,"oval",fur,side*.40,.26,.49,.22,.19,.21);
     p(head,"round",0xe4c97a,side*.43,.30,.64,.095,.095,.05);
     p(head,"round",ink,side*.43,.30,.68,.035,.058,.026);
     p(head,"round",ink,side*.43,-.04,1.50,.08,.043,.05);
     for(let i=0;i<3;i++)p(head,"cone",pale,side*.48,-.48,1.10+i*.19,.09,.23,.10,0,0,Math.PI);
   }
 }else if(form==="tortoise"){
   p(head,"oval",fur,0,-.16,.45,.35,.30,.48);
   p(head,"oval",0x9ab58a,0,-.28,.76,.26,.13,.19);
   eye(head,.23,.07,.67);
 }else if(form==="snake"){
   p(head,"oval",fur,0,-.17,.40,.40,.20,.72);
   eye(head,.31,.10,.68);
   p(head,"cube",0x846b59,0,-.38,.64,.31,.025,.52);
   p(head,"cone",0xb85559,0,-.43,1.01,.10,.38,.08,Math.PI/2);
 }else if(form==="lizard"||form==="synapsid"){
   p(head,"oval",fur,0,-.16,.41,.37,.29,.72);
   eye(head,.29,.10,.64);
   p(head,"cube",0x67695a,0,-.39,.70,.32,.04,.45);
   if(form==="synapsid"){
     for(const side of [-1,1])p(head,"cone",pale,side*.25,-.35,.86,.075,.30,.08,0,0,Math.PI);
   }
 }
}
export function createLandAnimal(a){
 const form=LAND_FORMS[a.species]||"deer",fur=colors[form]||0x92826a;
 const [width,height,depth,torsoY]=bodyInfo[form]||[.54,.51,.86,1.14];
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const legs=[],arms=[];
 if(form==="snake"){
   for(let i=0;i<9;i++){
     const z=-1.15+i*.31,x=Math.sin(i*.63)*.18;
     p(body,"oval",i%3===0?0x648057:fur,x,.31,z,.30,.23,.46);
   }
 }else{
   p(body,"oval",fur,0,torsoY,0,width,height,depth);
   if(form==="sheep")for(let i=0;i<9;i++){
     const z=-.72+(i%3)*.62,x=(Math.floor(i/3)-1)*.42;
     p(body,"facet",pale,x,torsoY+height*.75,z,.29,.28,.30);
   }
   if(form==="camel")for(let i=0;i<2;i++)p(body,"oval",fur,0,torsoY+.65,-.40+i*.75,.37,.66,.33);
   if(form==="giraffe"){
     p(body,"trunk",fur,0,torsoY+1.13,.63,.34,2.9,.33,.20);
     for(let i=0;i<6;i++){
       p(body,"facet",0x96704a,(i%2?.35:-.35),torsoY+.4+(i%3)*.39,-.53+Math.floor(i/3)*.71,.24,.23,.24);
     }
   }
   if(form==="bison")p(body,"oval",0x483b2e,0,torsoY+.46,.48,.73,.63,.62);
   if(["elephant","mammoth"].includes(form))p(body,"oval",fur,0,torsoY+.22,.45,.73,.67,.66);
   if(form==="tortoise"){
     p(body,"oval",0x574c35,0,torsoY+.24,0,.77,.55,.99);
     for(let i=0;i<6;i++){
       const ang=i*Math.PI/3;
       p(body,"facet",0x7a6748,Math.cos(ang)*.40,torsoY+.59,Math.sin(ang)*.54,.25,.13,.28);
     }
   }
   if(form==="crocodile"){
     for(let i=0;i<8;i++)p(body,"cone",0x4a604d,0,.96,-1.15+i*.29,.22,.35,.21);
   }
   const longLeg=["horse","zebra","giraffe","camel","deer","kangaroo"].includes(form);
   const shortLeg=["rabbit","crocodile","tortoise","frog","salamander","lizard"].includes(form);
   const length=longLeg?1.05:shortLeg?.44:form==="hippo"?.74:1.0;
   if(form==="kangaroo"){
     for(const side of [-1,1]){
       legs.push(hoofLeg(body,side*.30,1.02,-.24,fur,1.08,0x665b52,.31));
       arms.push(hoofLeg(body,side*.38,1.63,.40,fur,.35,fur,.13));
     }
   }else if(form==="primate"){
     for(const side of [-1,1]){
       legs.push(hoofLeg(body,side*.35,1.0,-.25,fur,.85,0x393a34,.30));
       arms.push(hoofLeg(body,side*.74,1.59,.39,fur,1.24,0x474139,.27));
     }
   }else{
     for(const zz of [-.59,.58])for(const side of [-1,1]){
       legs.push(hoofLeg(body,side*width*.77,torsoY-height*.4,zz*depth,fur,
         length,form==="elephant"||form==="mammoth"?0x77786f:0x49433c,shortLeg?.23:.18));
     }
   }
 }
 const longNeck=["giraffe","camel"].includes(form),elephantine=["elephant","mammoth"].includes(form);
 const head=new THREE.Group();body.add(head);
 head.position.set(0,longNeck?torsoY+2.34:elephantine?torsoY+.40:
   form==="kangaroo"?torsoY+.71:form==="primate"?torsoY+.41:torsoY+.31,
   form==="giraffe"?.96:form==="camel"?1.02:form==="crocodile"?depth*.79:
   form==="tortoise"?.88:depth*.65);
 const headWidth=elephantine?.69:form==="bear"?.57:form==="primate"?.52:.40;
 p(head,"oval",fur,0,0,0,headWidth,headWidth*.92,.46);
 if(["deer","horse","zebra","bison","cattle","goat","sheep","giraffe","camel","rhino",
 "hippo","rabbit","pig","boar","kangaroo","elephant","mammoth"].includes(form))
   herbivoreFace(head,form,fur);
 else if(["canid","fox","lion","tiger","leopard","bear"].includes(form))
   carnivoreFace(head,form,fur);
 else if(form==="primate"){
   p(head,"oval",0x554238,0,-.18,.37,.38,.35,.21);
   p(head,"cube",0x694f41,0,-.34,.54,.29,.14,.14);
   eye(head,.25,.17,.49,ink,.09);
   ears(head,fur,"round",.46,.03);
 }else reptileFace(head,form,fur);
 const tail=new THREE.Group();body.add(tail);
 tail.position.set(0,torsoY,-depth);
 if(form==="snake"){
   for(let i=0;i<5;i++)p(tail,"oval",fur,Math.sin(i)*.08,.27,-i*.18,.18-i*.028,.16-i*.022,.28-i*.030);
 }else if(form==="rabbit")p(tail,"oval",pale,0,0,-.08,.30,.30,.30);
 else if(form==="kangaroo")p(tail,"cone",fur,0,-.13,-.78,.29,1.75,.27,Math.PI/2);
 else if(["horse","zebra"].includes(form))p(tail,"cone",0x433a35,0,-.27,-.45,.17,.91,.21,Math.PI/2);
 else if(form==="lion")p(tail,"cone",0x5f442a,0,-.14,-.42,.14,.85,.14,Math.PI/2);
 else p(tail,"cone",fur,0,-.10,-.35,.17,.65,.17,Math.PI/2);
 if(["tiger","zebra"].includes(form))for(let i=0;i<5;i++){
   const side=i%2?-1:1,z=-.65+i*.31;
   p(body,"cube",0x343333,side*width*.77,torsoY+.12,z,.07,.32,.12,0,0,side*.12);
 }
 if(form==="leopard")for(let i=0;i<12;i++){
   const side=i%2?-1:1,z=-.75+(i%6)*.29;
   p(body,"facet",0x5a422b,side*width*.75,torsoY+((i%3)-1)*.27,z,.06,.07,.08);
 }
 root.userData={legs,arms,head,body,tail,modelFamily:form};
 return root;
}
