import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {REGION_SIZE,riverX} from "./surface-world.js";

const color=(hex)=>new THREE.MeshStandardMaterial({color:hex,roughness:1,flatShading:true});
const m={trunk:color(0x65452e),leaf:color(0x4c9860),leaf2:color(0x60ac64),
  human:color(0xd9a981),cloth:color(0x4778ad),predator:color(0xc77c38),
  grazer:color(0xc3ae7c),bird:color(0xe4e3c8),roof:color(0x9a6350),
  hut:color(0xd2b98c),eye:new THREE.MeshBasicMaterial({color:0x1b2128}),
  water:new THREE.MeshStandardMaterial({color:0x2679ac,transparent:true,opacity:.77,roughness:.39,side:THREE.DoubleSide}),
  river:new THREE.MeshStandardMaterial({color:0x369ac7,transparent:true,opacity:.84,roughness:.4,side:THREE.DoubleSide})};
const globe=Math.PI*2;
export class SurfaceView{
  constructor(canvas,viewport,world,{onSelect=()=>{},onExit=()=>{},onAction=()=>{}}={}){
    this.canvas=canvas;this.viewport=viewport;this.world=world;
    this.onSelect=onSelect;this.onExit=onExit;this.onAction=onAction;this.action="inspect";
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xa1c7e4);
    this.scene.fog=new THREE.FogExp2(0xa1c7e4,.005);
    this.camera=new THREE.PerspectiveCamera(55,1,.1,380);
    this.camera.position.set(47,64,85);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
    this.controls=new OrbitControls(this.camera,canvas);
    this.controls.enableDamping=true;this.controls.minDistance=7;this.controls.maxDistance=170;
    this.controls.maxPolarAngle=Math.PI/2-.07;this.controls.minPolarAngle=.08;
    this.controls.target.set(0,2,0);
    this.scene.add(new THREE.HemisphereLight(0xdff4fc,0x748367,2.2));
    const sun=new THREE.DirectionalLight(0xffecc5,2.7);sun.position.set(42,90,54);
    sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
    sun.shadow.camera.left=-100;sun.shadow.camera.right=100;sun.shadow.camera.top=100;sun.shadow.camera.bottom=-100;
    sun.shadow.camera.far=230;this.scene.add(sun);
    this.worldRoot=new THREE.Group();this.scene.add(this.worldRoot);
    this.characters=new Map();this.structures=new Map();this.instanced=[];this.treeMeshes=[];this.treeCount=0;this.visible=true;this.weatherFlash=0;
    this.terrain=null;this.river=null;this.pointerDown=null;this.interactTargets=[];
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.onDown=e=>this.pointerDown={x:e.clientX,y:e.clientY};
    this.onUp=e=>{
      if(!this.pointerDown||Math.hypot(e.clientX-this.pointerDown.x,e.clientY-this.pointerDown.y)>7)return;
      this.interact(e);
    };
    this.onWheel=e=>{
      if(e.deltaY>0&&this.camera.position.distanceTo(this.controls.target)>158)this.onExit();
    };
    canvas.addEventListener("pointerdown",this.onDown);
    canvas.addEventListener("pointerup",this.onUp);
    canvas.addEventListener("wheel",this.onWheel,{passive:true});
    this.rebuild();
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(viewport);this.resize();
    this.running=true;this.previous=performance.now();this.frame=this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }
  setAction(action){this.action=action}
  setWorld(world){this.world=world;this.rebuild()}
  addObj(mesh,x,y,z,parent=this.worldRoot){
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  rebuild(){
    for(const child of [...this.worldRoot.children])this.worldRoot.remove(child);
    for(const obj of this.instanced){obj.geometry.dispose();obj.material.dispose()}
    this.instanced=[];this.treeMeshes=[];this.characters.clear();this.structures.clear();
    this.buildTerrain();this.buildWater();this.buildTrees();this.buildProps();
    this.syncAgents();this.syncBuildings();
  }
  buildTerrain(){
    const n=130,positions=[],colors=[],indices=[];
    const deep=new THREE.Color(0x526e46),grass=new THREE.Color(0x7fa360),rock=new THREE.Color(0x8b8d82),snow=new THREE.Color(0xd6dbd9);
    for(let z=0;z<=n;z++){
      const pz=(z/n-.5)*REGION_SIZE;
      for(let x=0;x<=n;x++){
        const px=(x/n-.5)*REGION_SIZE,h=this.world.height(px,pz);
        positions.push(px,h,pz);
        let c=grass.clone();
        if(h<-1.5)c=new THREE.Color(0x738668);
        else if(h>10)c.copy(snow);
        else if(h>6)c.copy(rock);
        else if(h>2)c.lerp(rock,Math.min(.65,(h-2)/13));
        if(Math.sin(px*.18+pz*.25)>.6)c.lerp(deep,.22);
        colors.push(c.r,c.g,c.b);
      }
    }
    for(let z=0;z<n;z++)for(let x=0;x<n;x++){
      const i=z*(n+1)+x;indices.push(i,i+n+1,i+1,i+1,i+n+1,i+n+2);
    }
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    g.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94,side:THREE.DoubleSide}));
    mesh.receiveShadow=true;this.worldRoot.add(mesh);this.terrain=mesh;
  }
  buildWater(){
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(REGION_SIZE,REGION_SIZE),m.water);
    plane.rotation.x=-Math.PI/2;plane.position.y=-5.3;this.worldRoot.add(plane);
    const positions=[],indices=[],segments=200,width=3.5;
    for(let i=0;i<=segments;i++){
      const z=-89+i/segments*178,cx=riverX(z,this.world.terrainSeed);
      for(const side of [-1,1]){
        const px=cx+side*width;
        positions.push(px,this.world.height(px,z)+.32,z);
      }
      if(i<segments){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3)}
    }
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    g.setIndex(indices);g.computeVertexNormals();
    this.river=new THREE.Mesh(g,m.river);this.worldRoot.add(this.river);
  }
  buildTrees(){
    const alive=this.world.trees.filter(t=>t.alive);
    const stemGeo=new THREE.CylinderGeometry(.17,.28,2,5);
    const foliageGeo=new THREE.ConeGeometry(1.4,4.1,6);
    const stemMat=m.trunk.clone(),leafMat=m.leaf.clone();
    const stem=new THREE.InstancedMesh(stemGeo,stemMat,alive.length);
    const foliage=new THREE.InstancedMesh(foliageGeo,leafMat,alive.length);
    const obj=new THREE.Object3D();
    for(let i=0;i<alive.length;i++){
      const tree=alive[i],h=this.world.height(tree.x,tree.z),s=tree.size;
      obj.position.set(tree.x,h+s,tree.z);obj.scale.set(s,s,s);obj.rotation.y=tree.id;
      obj.updateMatrix();stem.setMatrixAt(i,obj.matrix);
      obj.position.y=h+3.0*s;obj.updateMatrix();foliage.setMatrixAt(i,obj.matrix);
    }
    stem.instanceMatrix.needsUpdate=true;foliage.instanceMatrix.needsUpdate=true;
    stem.castShadow=true;foliage.castShadow=true;
    this.worldRoot.add(stem,foliage);
    this.instanced.push(stem,foliage);this.treeMeshes=[stem,foliage];this.treeCount=alive.length;
  }
  buildProps(){
    // A few cliff boulders make mountain slopes readable when zoomed in.
    const positions=[];
    for(let x=-78;x<=78;x+=11)for(let z=-78;z<=78;z+=11){
      const h=this.world.height(x,z);
      if(h>5)positions.push({x,z,h});
    }
    const geo=new THREE.DodecahedronGeometry(.95,0),mat=color(0x92948b);
    const rock=new THREE.InstancedMesh(geo,mat,positions.length),obj=new THREE.Object3D();
    for(let i=0;i<positions.length;i++){
      const p=positions[i],s=1+((i*13)%7)*.31;
      obj.position.set(p.x,p.h+.25,p.z);obj.scale.set(s,.8*s,.8*s);obj.updateMatrix();
      rock.setMatrixAt(i,obj.matrix);
    }
    rock.instanceMatrix.needsUpdate=true;this.worldRoot.add(rock);this.instanced.push(rock);
  }
  makeAgentMesh(agent){
    const root=new THREE.Group();root.userData.agentId=agent.id;
    const add=(geo,mat,x,y,z,sx=1,sy=1,sz=1)=>{
      const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
      mesh.castShadow=true;root.add(mesh);return mesh;
    };
    const sphere=new THREE.SphereGeometry(.55,8,6);
    if(agent.type==="human"){
      add(new THREE.CylinderGeometry(.3,.42,1.15,7),m.cloth,0,1.12,0);
      add(new THREE.SphereGeometry(.33,8,7),m.human,0,2.02,0);
      const left=add(new THREE.CylinderGeometry(.11,.13,.8,6),m.human,-.21,.38,0);
      const right=add(new THREE.CylinderGeometry(.11,.13,.8,6),m.human,.21,.38,0);
      add(new THREE.CylinderGeometry(.10,.11,.78,6),m.human,-.49,1.15,0).rotation.z=-.3;
      add(new THREE.CylinderGeometry(.10,.11,.78,6),m.human,.49,1.15,0).rotation.z=.3;
      root.userData.legs=[left,right];
    }else if(agent.type==="bird"){
      add(sphere,m.bird,0,.25,0,.58,.43,.85);
      add(new THREE.ConeGeometry(.14,.35,5),m.roof,0,.27,.7).rotation.x=Math.PI/2;
      const left=add(new THREE.BoxGeometry(1.4,.06,.42),m.bird,-.78,.36,0);
      const right=add(new THREE.BoxGeometry(1.4,.06,.42),m.bird,.78,.36,0);
      root.userData.wings=[left,right];
    }else{
      const mat=agent.type==="predator"?m.predator:m.grazer;
      add(new THREE.BoxGeometry(1.5,.75,.9),mat,0,.87,0);
      add(sphere,mat,0,1.16,.76,.66,.67,.67);
      const legs=[];
      for(const x of [-.55,.55])for(const z of [-.36,.36])legs.push(add(
        new THREE.CylinderGeometry(.12,.16,.85,6),mat,x,.38,z));
      root.userData.legs=legs;
      if(agent.type==="grazer"){
        add(new THREE.ConeGeometry(.11,.42,5),m.trunk,-.24,1.76,.77);
        add(new THREE.ConeGeometry(.11,.42,5),m.trunk,.24,1.76,.77);
      }
    }
    root.traverse(child=>{if(child.isMesh)child.userData.agentId=agent.id});
    root.position.set(agent.x,this.world.height(agent.x,agent.z),agent.z);
    this.worldRoot.add(root);return root;
  }
  syncAgents(){
    for(const a of this.world.agents){
      if(!a.active){const obj=this.characters.get(a.id);if(obj){this.worldRoot.remove(obj);this.characters.delete(a.id)}continue}
      if(!this.characters.has(a.id))this.characters.set(a.id,this.makeAgentMesh(a));
    }
  }
  syncBuildings(){
    for(const building of this.world.structures){
      if(this.structures.has(building.id))continue;
      const root=new THREE.Group(),base=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.0,.35,6),m.hut),
        walls=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.4,2.4,6),m.hut),
        roof=new THREE.Mesh(new THREE.ConeGeometry(2.25,1.6,6),m.roof);
      base.position.y=.15;walls.position.y=1.3;roof.position.y=3;
      root.add(base,walls,roof);root.position.set(building.x,this.world.height(building.x,building.z),building.z);
      root.userData.structureId=building.id;
      for(const child of root.children){child.castShadow=true;child.userData.structureId=building.id}
      this.worldRoot.add(root);this.structures.set(building.id,root);
    }
  }
  setPointer(e){
    const rect=this.canvas.getBoundingClientRect();
    this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
  }
  interact(e){
    this.setPointer(e);
    const meshes=[...this.characters.values(),...this.structures.values()];
    if(this.action==="inspect"){
      const hits=this.raycaster.intersectObjects(meshes,true);
      if(hits.length){
        let node=hits[0].object;
        while(node&&!node.userData?.agentId&&!node.userData?.structureId)node=node.parent;
        if(node?.userData.agentId){
          const a=this.world.agents.find(a=>a.id===node.userData.agentId);
          if(a)this.onSelect(a);return;
        }
        if(node?.userData.structureId){this.onSelect({type:"shelter",id:node.userData.structureId,goal:"occupied",hunger:0,energy:100});return}
      }
      const ground=this.raycaster.intersectObject(this.terrain);
      if(ground.length)this.onSelect(null,ground[0].point);
    }else{
      const ground=this.raycaster.intersectObject(this.terrain);
      if(ground.length){
        const p=ground[0].point;this.world.intervene(this.action,p.x,p.z);
        this.buildTreesAfterChanges();this.syncAgents();this.syncBuildings();this.weatherFlash=this.action==='lightning'?.42:0;this.onAction(this.action,p);
      }
    }
  }
  buildTreesAfterChanges(){
    for(const old of this.treeMeshes){
      this.worldRoot.remove(old);old.geometry.dispose();old.material.dispose();
    }
    this.instanced=this.instanced.filter(mesh=>!this.treeMeshes.includes(mesh));
    this.treeMeshes=[];this.buildTrees();
  }
  resize(){
    const w=this.viewport.clientWidth,h=this.viewport.clientHeight;
    if(!w||!h)return;
    this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);
  }
  frame(now){
    if(!this.running)return;
    const dt=Math.min(.07,(now-this.previous)/1000);this.previous=now;
    if(!this.visible){requestAnimationFrame(this.frame);return}
    this.world.update(dt);
    if(Math.floor(now/500)!==Math.floor((now-dt*1000)/500))this.syncAgents();
    if(Math.floor(now/1200)!==Math.floor((now-dt*1000)/1200))this.syncBuildings();
    if(Math.floor(now/5000)!==Math.floor((now-dt*1000)/5000)){
      const alive=this.world.trees.filter(t=>t.alive).length;
      if(alive!==this.treeCount)this.buildTreesAfterChanges();
    }
    if(this.weatherFlash>0){this.weatherFlash=Math.max(0,this.weatherFlash-dt);
      this.scene.background.setHex(this.weatherFlash>.18?0xdfefff:0xa1c7e4)}
    else this.scene.background.setHex(this.world.rain>0?0x819bab:0xa1c7e4);
    for(const a of this.world.agents){
      if(!a.active)continue;
      const obj=this.characters.get(a.id);if(!obj)continue;
      const h=this.world.height(a.x,a.z);
      obj.position.set(a.x,h+(a.type==="bird"?a.altitude:0),a.z);
      obj.rotation.y=a.rotation;
      if(obj.userData.wings){
        obj.userData.wings[0].rotation.z=.5+Math.sin(now*.017+a.id)*.55;
        obj.userData.wings[1].rotation.z=-.5-Math.sin(now*.017+a.id)*.55;
      }
      if(obj.userData.legs){
        for(let i=0;i<obj.userData.legs.length;i++)
          obj.userData.legs[i].rotation.x=Math.sin(now*.010+a.id+i*Math.PI)*.20;
      }
    }
    this.controls.update();this.renderer.render(this.scene,this.camera);
    requestAnimationFrame(this.frame);
  }
  dispose(){
    this.running=false;this.resizeObserver.disconnect();
    this.canvas.removeEventListener("pointerdown",this.onDown);
    this.canvas.removeEventListener("pointerup",this.onUp);
    this.canvas.removeEventListener("wheel",this.onWheel);
    this.controls.dispose();
    for(const child of this.worldRoot.children)child.traverse?.(c=>{c.geometry?.dispose()});
    this.renderer.dispose();
  }
}
