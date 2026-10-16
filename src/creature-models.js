// Procedural low-poly characters with recognizable anatomy, faces and animated joints.
// Models are purposefully stylized for WebGL speed rather than photorealistic scans.
import * as THREE from "three";

const materials=new Map();
function mat(hex){
  if(!materials.has(hex))materials.set(hex,new THREE.MeshStandardMaterial({
    color:hex,flatShading:true,roughness:.87}));
  return materials.get(hex);
}
const geos={
  head:new THREE.IcosahedronGeometry(1,1),
  rounded:new THREE.IcosahedronGeometry(1,0),
  box:new THREE.BoxGeometry(1,1,1),
  limb:new THREE.CylinderGeometry(.5,.56,1,7),
  tapered:new THREE.CylinderGeometry(.37,.64,1,7),
  cone:new THREE.ConeGeometry(.5,1,7),
  ear:new THREE.ConeGeometry(.48,1,4),
  eye:new THREE.SphereGeometry(1,7,5),
  sphere:new THREE.SphereGeometry(1,8,6),
  horn:new THREE.ConeGeometry(.5,1,5),
};
function mesh(root,shape,c,x,y,z,sx=1,sy=1,sz=1,rz=0,rx=0,ry=0){
  const m=new THREE.Mesh(geos[shape],mat(c));root.add(m);
  m.position.set(x,y,z);m.scale.set(sx,sy,sz);
  m.rotation.set(rx,ry,rz);m.castShadow=true;
  return m;
}
function human(a){
  const root=new THREE.Group(),look=a.id%4;
  const skin=[0xca9277,0xe1af8b,0x926148,0xb47d5d][a.id%4];
  const shirt=[0x4e7894,0x92705a,0x647c55,0xa45d62][look];
  const pants=[0x353d4c,0x514c42,0x4a4a40][a.id%3];
  const hair=[0x2e211d,0x4d382b,0x332f2a,0x75523a][a.id%4];
  const body=new THREE.Group();root.add(body);
  mesh(body,"tapered",shirt,0,1.42,0,.60,.88,.39);
  mesh(body,"head",skin,0,2.26,.04,.36,.39,.34);
  mesh(body,"head",hair,0,2.52,-.03,.37,.14,.34);
  mesh(body,"rounded",skin,0,2.23,.37,.17,.12,.13); // nose
  for(const side of [-1,1]){
    mesh(body,"eye",0x172a30,side*.165,2.34,.345,.042,.048,.029);
    mesh(body,"rounded",skin,side*.37,2.27,.025,.075,.13,.13); // ears
  }
  mesh(body,"box",0x844f4a,0,2.10,.365,.14,.018,.022); // mouth
  mesh(body,"box",pants,0,.81,-.04,.40,.13,.30);
  const legs=[],arms=[];
  for(const side of [-1,1]){
    const leg=new THREE.Group();leg.position.set(side*.20,.77,0);body.add(leg);
    mesh(leg,"tapered",pants,0,-.30,0,.18,.58,.21);
    mesh(leg,"box",0x343734,0,-.63,.13,.19,.16,.33);
    legs.push(leg);
    const arm=new THREE.Group();arm.position.set(side*.55,1.73,0);body.add(arm);
    mesh(arm,"tapered",shirt,0,-.28,0,.19,.48,.19,side*.07);
    mesh(arm,"head",skin,0,-.57,.03,.145,.18,.16);
    arms.push(arm);
  }
  if(a.id%3===0){
    mesh(body,"box",0x806743,-.48,1.22,-.23,.10,.66,.06,-.40);
    mesh(body,"box",0x806743,.48,1.22,-.23,.10,.66,.06,.40);
    mesh(body,"box",0x9b794d,0,1.28,-.46,.44,.45,.23);
  }else if(a.id%5===0){
    mesh(body,"cone",0x695137,0,2.65,.02,.46,.24,.45);
  }
  root.userData={legs,arms,body};
  return root;
}
function quadruped(a){
  const predator=a.type==="predator",root=new THREE.Group();
  const coat=predator?(a.id%3===0?0xb27d4a:0x94684e):(a.id%3===0?0xcdb287:0xb8a181);
  const back=predator?0x73523e:0x92795e,cream=predator?0xe6cbb1:0xe4d8bb;
  const body=new THREE.Group();root.add(body);
  mesh(body,"head",coat,0,1.22,0,.95,.50,.53);
  mesh(body,"head",back,0,1.46,-.08,.68,.24,.45);
  mesh(body,"head",cream,0,.93,.29,.55,.16,.38);
  const neck=mesh(body,"tapered",coat,0,1.48,.67,.40,.74,.39,-.14);
  const head=new THREE.Group();head.position.set(0,1.83,.85);body.add(head);
  mesh(head,"head",coat,0,0,.15,.47,.43,.49);
  mesh(head,"head",cream,0,-.20,.52,.38,.22,.41);
  mesh(head,"rounded",0x252a2d,0,-.14,.86,.13,.11,.13);
  for(const side of [-1,1]){
    mesh(head,"eye",0x1c231d,side*.29,.08,.53,.08,.075,.046);
    mesh(head,"eye",0xf3e5cc,side*.31,.12,.565,.025,.028,.022);
    const ear=mesh(head,"ear",coat,side*.34,.49,-.04,.30,.49,.24,side*-.12);
    mesh(head,"ear",predator?0x9c5d54:0xbf997c,side*.34,.52,.15,.16,.31,.10,side*-.10);
    if(!predator){
      // Antlers for some grazers, short curving branches for others.
      if(a.id%3!==0){
        mesh(head,"horn",0x775e3e,side*.27,.97,-.06,.12,.83,.12,side*-.21);
        mesh(head,"horn",0x775e3e,side*.43,1.05,.05,.09,.36,.09,side*.45);
      }
    }
  }
  const legs=[];
  for(const xx of [-.60,.60])for(const zz of [-.32,.34]){
    const leg=new THREE.Group();leg.position.set(xx,1.02,zz);body.add(leg);
    mesh(leg,"tapered",coat,0,-.35,0,.20,.69,.20);
    mesh(leg,"box",predator?0x534638:0x49453f,0,-.75,.10,.23,.15,.32);
    legs.push(leg);
  }
  const tail=new THREE.Group();tail.position.set(0,1.4,-.68);body.add(tail);
  mesh(tail,"tapered",coat,0,.10,-.41,.18,.21,.66,-.52);
  mesh(tail,"cone",predator?back:coat,0,.03,-.84,.35,.52,.33,1.2);
  root.userData={legs,head,tail,body};
  return root;
}
function bird(a){
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const plumage=[0xd7c2a0,0xb6b5c2,0x9a9e75,0xc5a2a1][a.id%4];
  const wingColor=[0xa5a1a7,0x797d93,0x777d5b,0xad7a77][a.id%4];
  mesh(body,"head",plumage,0,.33,0,.48,.31,.67);
  mesh(body,"head",plumage,0,.58,.45,.29,.31,.26);
  mesh(body,"cone",0xc99541,0,.53,.77,.19,.40,.18,0,Math.PI/2);
  for(const side of [-1,1])mesh(body,"eye",0x222222,side*.22,.67,.60,.056,.057,.045);
  mesh(body,"cone",wingColor,0,.30,-.86,.30,.78,.28,0,-Math.PI/2);
  const wings=[];
  for(const side of [-1,1]){
    const wing=new THREE.Group();wing.position.set(side*.33,.45,.04);body.add(wing);
    mesh(wing,"box",plumage,side*.54,0,-.03,1.18,.055,.30);
    for(let i=0;i<5;i++){
      mesh(wing,"cone",wingColor,side*(.37+i*.26),0,-.18,
        .28,.56+(4-i)*.09,.18,0,Math.PI/2);
    }
    wings.push(wing);
    mesh(body,"tapered",0xa8794c,side*.18,-.10,-.10,.12,.43,.12);
    for(const j of [-1,0,1])mesh(body,"tapered",0xa8794c,side*.18+j*.08,-.28,.10,.08,.20,.06,Math.PI/2);
  }
  root.userData={wings,body};
  return root;
}
export function createCreatureModel(agent){
  const root=agent.type==="human"?human(agent):agent.type==="bird"?bird(agent):quadruped(agent);
  root.userData.agentId=agent.id;
  root.traverse(child=>{if(child.isMesh)child.userData.agentId=agent.id});
  return root;
}
