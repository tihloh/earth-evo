import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {REGION_SIZE} from "./surface-world.js";
import {STREAM_CHUNK_SIZE,localToGeo} from "./geography.js";
import {OpenWorldStreamer} from "./open-world.js";
import {configurePrecisionCamera,setCameraGlide,confineSurfaceTarget} from "./camera-controls.js";
import {buildVegetationMeshes} from "./vegetation-view.js";
import {createCreatureModel} from "./creature-models.js";

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
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(world.era<120?0x684c43:0xa1c7e4);
    this.scene.fog=new THREE.FogExp2(0xa1c7e4,.017);
    this.camera=new THREE.PerspectiveCamera(55,1,.1,380);
    this.camera.position.set(47,64,85);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
    this.controls=new OrbitControls(this.camera,canvas);
    configurePrecisionCamera(this.controls,"surface",2);
    this.controls.minDistance=4;this.controls.maxDistance=170;
    this.controls.maxPolarAngle=Math.PI/2-.07;this.controls.minPolarAngle=.08;
    this.controls.target.set(0,2,0);
    this.scene.add(new THREE.HemisphereLight(0xdff4fc,0x748367,2.2));
    const sun=new THREE.DirectionalLight(0xffecc5,2.7);sun.position.set(42,90,54);
    sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
    sun.shadow.camera.left=-100;sun.shadow.camera.right=100;sun.shadow.camera.top=100;sun.shadow.camera.bottom=-100;
    sun.shadow.camera.far=230;this.scene.add(sun);
    this.worldRoot=new THREE.Group();this.scene.add(this.worldRoot);
    this.characters=new Map();this.structures=new Map();this.instanced=[];this.treeMeshes=[];this.treeCount=0;this.visible=true;this.weatherFlash=0;this.speed=1;this.paused=false;this.followAgentId=null;
    this.terrain=null;this.river=null;this.pointerDown=null;this.interactTargets=[];
    this.terrainChunks=new Map();this.terrainMeshes=[];
    this.waterChunks=new Map();this.renderRadius=3;
    this.fogDetailRadius=1;this.lastTileUpdate=0;this.chunkCenter="";
    this.terrainMaterial=new THREE.MeshStandardMaterial({
      vertexColors:true,roughness:.96,flatShading:false,side:THREE.DoubleSide
    });
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.onDown=e=>this.pointerDown={x:e.clientX,y:e.clientY};
    this.onUp=e=>{
      if(!this.pointerDown||Math.hypot(e.clientX-this.pointerDown.x,e.clientY-this.pointerDown.y)>7)return;
      this.interact(e);
    };
    // Explicit Return to planet prevents a zoom-out gesture from switching modes unexpectedly.
    this.onWheel=()=>{};
    canvas.addEventListener("pointerdown",this.onDown);
    canvas.addEventListener("pointerup",this.onUp);
    canvas.addEventListener("wheel",this.onWheel,{passive:true});
    this.rebuild();
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(viewport);this.resize();
    this.running=true;this.previous=performance.now();this.frame=this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }
  setGlide(value){setCameraGlide(this.controls,value)}
  setAction(action){this.action=action}
  setRenderDistance(radius){
    this.renderRadius=Math.max(2,Math.min(4,Math.round(radius)));
    this.terrainChunks.forEach(t=>t.geometry.dispose());
    for(const m of this.terrainChunks.values())this.worldRoot.remove(m);
    for(const m of this.waterChunks.values()){this.worldRoot.remove(m);m.geometry.dispose()}
    this.terrainChunks.clear();this.waterChunks.clear();this.terrainMeshes=[];
    this.chunkCenter="";this.updateTiles(true);
  }
  setWorld(world){this.world=world;this.followAgentId=null;this.rebuild()}
  addObj(mesh,x,y,z,parent=this.worldRoot){
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  rebuild(){
    const shared=Object.values(m);
    for(const child of [...this.worldRoot.children]){
      child.traverse(obj=>{
        if(obj.geometry&&!obj.userData.sharedGeometry)obj.geometry.dispose();
        if(obj.material&&!obj.userData.sharedMaterial&&!shared.includes(obj.material))obj.material.dispose();
      });
      this.worldRoot.remove(child);
    }
    this.instanced=[];this.treeMeshes=[];this.characters.clear();this.structures.clear();
    this.terrainChunks.clear();this.waterChunks.clear();this.terrainMeshes=[];
    this.streamer=new OpenWorldStreamer(this.world);
    this.streamer.update(this.controls.target.x,this.controls.target.z);
    this.buildTerrain();this.buildTrees();
    this.syncAgents();this.syncBuildings();
  }
  buildTerrain(){this.updateTiles(true)}
  makeTerrainTile(cx,cz,detail=true,explored=true){
    const size=STREAM_CHUNK_SIZE,segments=detail?20:7;
    const geometry=new THREE.PlaneGeometry(size,size,segments,segments);
    geometry.rotateX(-Math.PI/2);
    const positions=geometry.attributes.position,colors=[];
    const centerX=(cx+.5)*size,centerZ=(cz+.5)*size;
    const tint=new THREE.Color(),unknown=new THREE.Color(0x526774);
    for(let i=0;i<positions.count;i++){
      const x=centerX+positions.getX(i),z=centerZ+positions.getZ(i);
      const s=this.world.sample(x,z);
      positions.setY(i,s.height);
      if(this.world.era<120)tint.setHex(s.land?0x97523d:0xdf6737);
      else if(!s.land)tint.setHex(0x576f71);
      else if(s.river)tint.setHex(0x368bb8);
      else if(s.biome==="ice")tint.setHex(0xd8e5ed);
      else if(s.biome==="alpine")tint.setHex(0x969a92);
      else if(this.world.era<870)tint.setHex(0x9d8a75);
      else if(s.biome==="forest")tint.setHex(0x5d925d);
      else if(s.biome==="dryland")tint.setHex(0xb59f6f);
      else tint.setHex(0x86a86e);
      if(!explored)tint.lerp(unknown,.56);
      colors.push(tint.r,tint.g,tint.b);
    }
    positions.needsUpdate=true;
    geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,this.terrainMaterial);
    mesh.position.set(centerX,0,centerZ);mesh.receiveShadow=true;
    mesh.userData.tileKey=cx+","+cz;
    mesh.userData.sharedMaterial=true;
    return mesh;
  }
  updateTiles(force=false){
    const size=STREAM_CHUNK_SIZE;
    const cx=Math.floor(this.controls.target.x/size);
    const cz=Math.floor(this.controls.target.z/size);
    const state=cx+","+cz+"/"+this.renderRadius;
    if(!force&&state===this.chunkCenter)return;
    this.chunkCenter=state;
    const floraChanged=this.streamer.update(this.controls.target.x,this.controls.target.z);
    const desired=new Map();
    for(let dx=-this.renderRadius;dx<=this.renderRadius;dx++)
      for(let dz=-this.renderRadius;dz<=this.renderRadius;dz++){
        const xx=cx+dx,zz=cz+dz,key=xx+","+zz;
        const detail=Math.max(Math.abs(dx),Math.abs(dz))<=this.fogDetailRadius;
        const explored=this.streamer.isExplored(xx,zz);
        desired.set(key,{xx,zz,detail,explored});
      }
    for(const [key,mesh]of this.terrainChunks){
      if(desired.has(key)&&mesh.userData.detail===desired.get(key).detail&&
          mesh.userData.explored===desired.get(key).explored)continue;
      this.worldRoot.remove(mesh);mesh.geometry.dispose();this.terrainChunks.delete(key);
      const water=this.waterChunks.get(key);
      if(water){this.worldRoot.remove(water);water.geometry.dispose();this.waterChunks.delete(key)}
    }
    for(const [key,t]of desired){
      if(this.terrainChunks.has(key))continue;
      const tile=this.makeTerrainTile(t.xx,t.zz,t.detail,t.explored);
      tile.userData.detail=t.detail;tile.userData.explored=t.explored;
      this.terrainChunks.set(key,tile);this.worldRoot.add(tile);
      if(this.world.era>=120){
        const water=new THREE.Mesh(new THREE.PlaneGeometry(size,size),m.water);
        water.rotation.x=-Math.PI/2;
        water.position.set((t.xx+.5)*size,0,(t.zz+.5)*size);
        this.worldRoot.add(water);this.waterChunks.set(key,water);
      }
    }
    this.terrainMeshes=[...this.terrainChunks.values()];
    if(floraChanged&&!force){
      this.buildTreesAfterChanges();
      this.syncAgents();this.syncBuildings();
    }
  }
  buildTrees(){
    const {meshes,treeCount}=buildVegetationMeshes(this.world);
    this.treeMeshes=meshes;this.treeCount=treeCount;
    this.instanced.push(...meshes);
    for(const mesh of meshes)this.worldRoot.add(mesh);
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
    const root=createCreatureModel(agent);
    root.position.set(agent.x,this.world.height(agent.x,agent.z),agent.z);
    this.worldRoot.add(root);
    return root;
  }
  syncAgents(){
    const available=new Set(this.world.agents.filter(a=>a.active).map(a=>a.id));
    for(const [id,obj] of this.characters)if(!available.has(id)){
      this.worldRoot.remove(obj);this.characters.delete(id);
    }
    for(const a of this.world.agents){
      if(!a.active){const obj=this.characters.get(a.id);if(obj){this.worldRoot.remove(obj);this.characters.delete(a.id)}continue}
      if(!this.characters.has(a.id))this.characters.set(a.id,this.makeAgentMesh(a));
    }
  }
  syncBuildings(){
    const available=new Set(this.world.structures.map(b=>b.id));
    for(const [id,obj] of this.structures)if(!available.has(id)){
      this.worldRoot.remove(obj);this.structures.delete(id);
    }
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
      const ground=this.raycaster.intersectObjects(this.terrainMeshes);
      if(ground.length)this.onSelect(null,ground[0].point);
    }else{
      const ground=this.raycaster.intersectObjects(this.terrainMeshes);
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
    if(!this.paused)for(let i=0;i<this.speed;i++)this.world.update(dt);
    if(now-this.lastTileUpdate>280){
      this.lastTileUpdate=now;this.updateTiles();
    }
    if(Math.floor(now/500)!==Math.floor((now-dt*1000)/500))this.syncAgents();
    if(Math.floor(now/1200)!==Math.floor((now-dt*1000)/1200))this.syncBuildings();
    if(Math.floor(now/5000)!==Math.floor((now-dt*1000)/5000)){
      const alive=this.world.trees.filter(t=>t.alive).length;
      if(alive!==this.treeCount)this.buildTreesAfterChanges();
    }
    if(this.weatherFlash>0){this.weatherFlash=Math.max(0,this.weatherFlash-dt);
      this.scene.background.setHex(this.weatherFlash>.18?0xdfefff:0xa1c7e4)}
    else this.scene.background.setHex(this.world.era<120?0x684c43:(this.world.rain>0?0x819bab:0xa1c7e4));
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
          obj.userData.legs[i].rotation.x=(a.target?1:0)*Math.sin(now*.010+a.id+i*Math.PI)*.24;
      }
    }
    if(this.followAgentId!==null){
      const followed=this.world.agents.find(a=>a.id===this.followAgentId&&a.active);
      if(followed){
        const target=new THREE.Vector3(followed.x,this.world.height(followed.x,followed.z)+1.5,followed.z);
        const delta=target.clone().sub(this.controls.target).multiplyScalar(.08);
        this.controls.target.add(delta);this.camera.position.add(delta);
      }else this.followAgentId=null;
    }
    this.controls.update();confineSurfaceTarget(this.controls,this.camera,10000);
    this.renderer.render(this.scene,this.camera);
    requestAnimationFrame(this.frame);
  }
  dispose(){
    this.running=false;this.resizeObserver.disconnect();
    this.canvas.removeEventListener("pointerdown",this.onDown);
    this.canvas.removeEventListener("pointerup",this.onUp);
    this.canvas.removeEventListener("wheel",this.onWheel);
    this.controls.dispose();
    const shared=Object.values(m);
    for(const child of this.worldRoot.children)child.traverse?.(c=>{
      if(!c.userData.sharedGeometry)c.geometry?.dispose();
      if(c.material&&!c.userData.sharedMaterial&&!shared.includes(c.material))c.material.dispose();
    });
    this.terrainMaterial.dispose();this.renderer.dispose();
  }
}
