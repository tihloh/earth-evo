// Procedural instanced, faceted trees and undergrowth for the regional explorer.
// Every species has a recognizable silhouette; no external textures or models.
import * as THREE from "three";

const SHAPES={
  trunk:()=>new THREE.CylinderGeometry(.23,.32,1,7),
  skinny:()=>new THREE.CylinderGeometry(.11,.18,1,6),
  branch:()=>new THREE.CylinderGeometry(.075,.13,1,5),
  crown:()=>new THREE.IcosahedronGeometry(1,1),
  bush:()=>new THREE.IcosahedronGeometry(1,0),
  cone:()=>new THREE.ConeGeometry(1,1,7),
  frond:()=>new THREE.ConeGeometry(.25,1,4),
  leaf:()=>new THREE.OctahedronGeometry(1,0),
  blade:()=>new THREE.ConeGeometry(.2,1,3),
  flower:()=>new THREE.IcosahedronGeometry(1,0),
  root:()=>new THREE.CylinderGeometry(.07,.11,1,5),
};
const PALETTE={
  bark:0x755039,darkBark:0x4f4435,birchBark:0xd4d3bc,palmBark:0x8f7751,
  leafGreen:0x418851,leafGold:0x77a963,leafLight:0x5fa36b,leafDark:0x29694d,
  evergreen:0x315e52,evergreenLight:0x427d5b,acacia:0x698b45,
  willow:0x739e53,palm:0x519b64,fern:0x3f8a63,grass:0x7fa464,
  reed:0xa0a966,flowerPink:0xef8db0,flowerYellow:0xffd46d,
  heather:0x9a76ae,mangrove:0x32715d,stems:0x6d8054,primitive:0x4f805b,spores:0x9ba96b,cycad:0x426e4c,ginkgo:0x839e57,algae:0x488c71
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const makeMesh=(shape,hex,transforms)=>{
  const material=new THREE.MeshStandardMaterial({color:PALETTE[hex]??hex,roughness:.96,flatShading:true,side:THREE.DoubleSide});
  const mesh=new THREE.InstancedMesh(SHAPES[shape](),material,transforms.length);
  const obj=new THREE.Object3D();
  transforms.forEach((t,i)=>{
    obj.position.set(t.x,t.y,t.z);
    obj.rotation.set(t.rx??0,t.ry??0,t.rz??0);
    obj.scale.set(t.sx??1,t.sy??1,t.sz??1);
    obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);
  });
  mesh.instanceMatrix.needsUpdate=true;
  mesh.castShadow=transforms.length<420;
  mesh.receiveShadow=false;
  mesh.frustumCulled=false;
  return mesh;
};
export function buildVegetationMeshes(world){
  const recipes=new Map();
  const put=(shape,palette,t)=> {
    const key=shape+"|"+palette;
    if(!recipes.has(key))recipes.set(key,{shape,palette,items:[]});
    recipes.get(key).items.push(t);
  };
  function part(kind,color,x,y,z,sx,sy,sz,rz=0,ry=0,rx=0){
    put(kind,color,{x,y,z,sx,sy,sz,rz,ry,rx});
  }
  const trees=world.trees.filter(t=>t.alive);
  for(const t of trees){
    const {x,z,id}=t,s=t.size||1,y=world.height(x,z);
    const species=t.species??"oak",turn=(id*1.618033988)%6.283185307;
    const rot=(offset)=>turn+offset;
    if(["pine","cedar","conifer"].includes(species)){
      const tall=(species==="cedar"?7.6:6.3)*s;
      part("trunk","darkBark",x,y+tall*.46,z,.65*s,tall*.92,.65*s);
      for(let i=0;i<3;i++){
        const wide=(species==="cedar"?1.9:2.25)*s*(1-i*.20);
        part("cone",i===1?"evergreenLight":"evergreen",x,y+(2.7+i*1.55)*s,z,
          wide,(3.7-i*.2)*s,wide,0,turn);
      }
    }else if(species==="clubmoss"||species==="horsetail"){
      const tall=(species==="clubmoss"?3.3:2.1)*s;
      part("skinny","primitive",x,y+tall*.5,z,.6*s,tall,.6*s);
      for(let j=0;j<7;j++){
        const a=rot(j*Math.PI*2/7),yOffset=tall*(.24+j*.08)*s;
        part("cone","primitive",x+Math.cos(a)*.35*s,y+yOffset,
          z+Math.sin(a)*.35*s,.45*s,1.6*s,.45*s,Math.cos(a)*.3,a);
      }
      part("cone","spores",x,y+tall*s,z,.30*s,.65*s,.30*s);
    }else if(species==="treeFern"||species==="cycad"){
      const tall=(species==="treeFern"?4.6:2.7)*s;
      part("trunk","darkBark",x,y+tall*.5,z,.57*s,tall,.57*s);
      for(let j=0;j<9;j++){
        const a=rot(j*Math.PI*2/9);
        const radius=species==="treeFern"?2.1:1.35;
        part("leaf",species==="treeFern"?"fern":"cycad",
          x+Math.cos(a)*radius*s,y+tall*s+.2*s,
          z+Math.sin(a)*radius*s,1.2*s,.13*s,2.9*s,0,a);
      }
    }else if(species==="ginkgo"){
      const height=6.1*s;
      part("trunk","bark",x,y+height*.5,z,.75*s,height,.75*s);
      for(let j=0;j<6;j++){
        const a=rot(j*Math.PI/3);
        part("crown","ginkgo",x+Math.cos(a)*1.45*s,y+height*s,
          z+Math.sin(a)*1.45*s,1.5*s,.73*s,1.45*s,0,a);
      }
    }else if(species==="palm"){
      const height=6.4*s,lean=Math.sin(id)*.14;
      part("skinny","palmBark",x+lean*.5,y+height*.5,z,
        .92*s,height,.92*s,-lean);
      for(let j=0;j<7;j++){
        const angle=rot(j*Math.PI*2/7),length=(2.4+(j%3)*.25)*s;
        const fx=x+Math.cos(angle)*length*.47+lean,fz=z+Math.sin(angle)*length*.47;
        part("frond",j%2?"leafLight":"palm",fx,y+height+.1*s,fz,
          1.6*s,3.3*s,1.6*s,Math.cos(angle)*1.07,angle,.38+Math.sin(angle)*.7);
      }
      part("bush","palm",x+lean,y+height+.35*s,z,.48*s,.42*s,.48*s);
    }else if(species==="acacia"){
      part("trunk","bark",x,y+2.8*s,z,.9*s,5.6*s,.9*s);
      for(let i=0;i<3;i++){
        const angle=rot(i*Math.PI*2/3);
        part("branch","bark",x+Math.cos(angle)*s,y+5.2*s,z+Math.sin(angle)*s,
          s,3.2*s,s,Math.cos(angle)*-.45,angle,Math.sin(angle)*.4);
      }
      for(let i=0;i<4;i++){
        const a=rot(i*Math.PI/2);
        part("crown","acacia",x+Math.cos(a)*1.6*s,y+6.0*s,z+Math.sin(a)*1.6*s,
          2.4*s,.72*s,2.1*s);
      }
    }else if(species==="willow"||species==="mangrove"){
      const height=species==="willow"?4.8:4.1;
      part("trunk","darkBark",x,y+height*s*.5,z,s,height*s,s);
      for(let i=0;i<6;i++){
        const a=rot(i*Math.PI/3),dx=Math.cos(a),dz=Math.sin(a);
        part("branch","darkBark",x+dx*1.1*s,y+height*s,z+dz*1.1*s,
          .73*s,2.7*s,.73*s,dx*.75,a,dz*.6);
        part(species==="willow"?"cone":"crown",species==="willow"?"willow":"mangrove",
          x+dx*2*s,y+(species==="willow"?3.6:4.4)*s,z+dz*2*s,
          1.05*s,(species==="willow"?2.7:1.45)*s,1.05*s);
        if(species==="mangrove")part("root","bark",x+dx*.55*s,y+.85*s,z+dz*.55*s,
          .45*s,2*s,.45*s,dx*.75,a);
      }
      part("crown","leafDark",x,y+height*s,z,2*s,1.2*s,2*s);
    }else{
      const birch=species==="birch",tall=(birch?6.3:5.8)*s;
      part("trunk",birch?"birchBark":"bark",x,y+tall*.5,z,(birch?.62:1)*s,tall,(birch?.62:1)*s);
      for(let i=0;i<5;i++){
        const a=rot(i*2.399963),dx=Math.cos(a),dz=Math.sin(a);
        part("branch",birch?"birchBark":"bark",x+dx*.8*s,y+tall*.75,z+dz*.8*s,
          .75*s,2*s,.75*s,dx*.7,a,dz*.4);
        part("crown",birch?"leafLight":i%3?"leafGreen":"leafGold",
          x+dx*1.8*s,y+(4.6+(i%3)*.60)*s,z+dz*1.8*s,
          (birch?1.3:1.8)*s,(birch?1.75:1.55)*s,(birch?1.3:1.8)*s);
      }
      part("crown",birch?"leafGold":"leafGreen",x,y+(6.6)*s,z,
        1.55*s,1.55*s,1.55*s);
    }
  }
  for(let i=0;i<world.undergrowth.length;i++){
    const p=world.undergrowth[i],{x,z,species}=p;
    const s=p.size||1,y=world.height(x,z);
    const rot=p.angle||0;
    if(["algalMat","earlyMoss","moss"].includes(species)){
      for(let j=0;j<4;j++){
        const a=rot+j*Math.PI/2;
        part("bush",species==="algalMat"?"algae":"primitive",
          x+Math.cos(a)*.28*s,y+.13*s,z+Math.sin(a)*.28*s,
          .45*s,.18*s,.43*s);
      }
    }else if(species==="clubmoss"||species==="horsetail"){
      const count=5,high=species==="horsetail"?1.5:.9;
      for(let j=0;j<count;j++){
        const a=rot+j*Math.PI*2/count;
        part("skinny","primitive",
          x+Math.cos(a)*.2*s,y+.5*high*s,z+Math.sin(a)*.2*s,
          .22*s,high*s,.22*s);
        part("cone","spores",
          x+Math.cos(a)*.2*s,y+high*s,z+Math.sin(a)*.2*s,
          .19*s,.30*s,.19*s);
      }
    }else if(species==="grass"||species==="reed"){
      const n=species==="reed"?4:5,length=species==="reed"?2.3:.9;
      for(let j=0;j<n;j++){
        const a=rot+j*Math.PI*2/n;
        part("blade",species==="reed"?"reed":"grass",
          x+Math.cos(a)*.13*s,y+length*s*.49,z+Math.sin(a)*.13*s,
          .75*s,length*s,.75*s,Math.cos(a)*.23,a,Math.sin(a)*.25);
        if(species==="reed")part("cone","stems",x+Math.cos(a)*.38*s,y+length*s,z+Math.sin(a)*.38*s,
          .32*s,.75*s,.32*s);
      }
    }else if(species==="flower"||species==="heather"){
      const n=species==="flower"?3:5;
      for(let j=0;j<n;j++){
        const a=rot+j*Math.PI*2/n;
        const bx=x+Math.cos(a)*.23, bz=z+Math.sin(a)*.23,by=y+(species==="heather"?.8:.62)*s;
        part("skinny","stems",bx,by,bz,.14*s,1.1*s,.14*s,0,a);
        part("flower",species==="heather"?"heather":j%2?"flowerYellow":"flowerPink",
          bx,by+.58*s,bz,(species==="heather"?.21:.29)*s,(species==="heather"?.21:.29)*s,(species==="heather"?.21:.29)*s);
      }
    }else if(species==="fern"){
      for(let j=0;j<5;j++){
        const a=rot+j*Math.PI*2/5;
        part("leaf","fern",x+Math.cos(a)*.55*s,y+.45*s,z+Math.sin(a)*.55*s,
          .5*s,.16*s,1.25*s,0,a);
      }
    }else{
      for(let j=0;j<4;j++){
        const a=rot+j*Math.PI/2,spread=j%2?.37:.23;
        part("bush",species==="scrub"?"acacia":"leafLight",
          x+Math.cos(a)*spread*s,y+(.34+(j%3)*.17)*s,z+Math.sin(a)*spread*s,
          (.4+(j%2)*.12)*s,.43*s,.42*s);
      }
    }
  }
  const meshes=[];
  for(const {shape,palette,items}of recipes.values()){
    if(items.length)meshes.push(makeMesh(shape,palette,items));
  }
  return {meshes,treeCount:trees.length,groundCoverCount:world.undergrowth.length};
}
