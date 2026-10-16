import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {W,H} from "./simulation.js";

export class PlanetView {
  constructor(canvas,viewport){
    this.canvas=canvas;this.viewport=viewport;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x07121f);
    this.camera=new THREE.PerspectiveCamera(43,1,.1,170);this.camera.position.set(0,1.2,7.9);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.controls=new OrbitControls(this.camera,canvas);
    this.controls.enablePan=false;this.controls.enableDamping=true;
    this.controls.minDistance=3.3;this.controls.maxDistance=12;
    this.root=new THREE.Group();this.scene.add(this.root);
    this.scene.add(new THREE.AmbientLight(0xb1c8e4,1.55));
    const sun=new THREE.DirectionalLight(0xffe9c9,3.4);sun.position.set(5,4,7);this.scene.add(sun);
    const w=1024,h=512;this.textureCanvas=document.createElement("canvas");this.textureCanvas.width=w;this.textureCanvas.height=h;
    this.ctx=this.textureCanvas.getContext("2d",{willReadFrequently:true});
    this.texture=new THREE.CanvasTexture(this.textureCanvas);this.texture.colorSpace=THREE.SRGBColorSpace;
    this.planet=new THREE.Mesh(new THREE.SphereGeometry(2.35,96,64),
      new THREE.MeshStandardMaterial({map:this.texture,roughness:.94}));
    this.root.add(this.planet);
    this.atmosphere=new THREE.Mesh(new THREE.SphereGeometry(2.395,64,48),
      new THREE.MeshBasicMaterial({color:0x67a8fb,transparent:true,opacity:.11,side:THREE.BackSide}));
    this.root.add(this.atmosphere);
    this.cloudLayer=new THREE.Mesh(new THREE.SphereGeometry(2.386,64,40),
      new THREE.MeshBasicMaterial({color:0xe0f1ff,wireframe:true,transparent:true,opacity:.028,depthWrite:false}));
    this.root.add(this.cloudLayer);
    this.lifeLayer=new THREE.Group();this.root.add(this.lifeLayer);
    this.cityLayer=new THREE.Group();this.root.add(this.cityLayer);
    const starPositions=new Float32Array(1800*3);
    for(let i=0;i<1800;i++){const phi=i*2.399963,t=1-2*(i+.5)/1800,r=Math.sqrt(1-t*t),distance=31+i%17;
      starPositions[i*3]=Math.cos(phi)*r*distance;starPositions[i*3+1]=t*distance;starPositions[i*3+2]=Math.sin(phi)*r*distance;}
    const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute("position",new THREE.BufferAttribute(starPositions,3));
    this.scene.add(new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xd4e3ff,size:.045})));
    this.lastSurface="";this.lastMarkers=-1;
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(viewport);
    this.resize();
    this.previous=performance.now();this.running=true;this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);
  }
  surfacePosition(lon,lat,radius=2.373){
    const phi=lat*Math.PI/180,theta=lon*Math.PI/180;
    // Three.js sphere uses the polar axis on Y.
    return new THREE.Vector3(-Math.cos(phi)*Math.cos(theta)*radius,Math.sin(phi)*radius,
      Math.cos(phi)*Math.sin(theta)*radius);
  }
  update(world,force=false){
    const bucket=Math.floor(world.tick/12);
    const key=[bucket,Math.round(world.warming*10),Math.round(world.seaShift*100),
      Math.round(world.cooling*10),world.speciesCount].join("/");
    if(force||key!==this.lastSurface){
      this.lastSurface=key;this.drawSurface(world);
    }
    if(force||world.tick!==this.lastMarkers){
      this.lastMarkers=world.tick;
      this.drawMarkers(world);
    }
  }
  drawSurface(world){
    const width=this.textureCanvas.width,height=this.textureCanvas.height;
    const pixels=this.ctx.createImageData(width,height),out=pixels.data;
    const landscape=world.tick>=850;
    const life=world.speciesCount>0,seaLevel=.08+world.seaShift*.5;
    for(let y=0;y<height;y++){
      const gridY=Math.min(H-1,Math.floor(y/height*H));
      for(let x=0;x<width;x++){
        const gridX=Math.min(W-1,Math.floor(x/width*W));
        const cell=world.cells[gridY*W+gridX];
        const land=cell.elevation>seaLevel;
        const icy=Math.abs(cell.lat)>74&&world.tick>=120;
        const heightTone=Math.max(0,Math.min(1,(cell.elevation-.08)*1.4));
        const biome=world.regions[cell.i],green=landscape?
          Math.min(1,biome.plant/12):0;
        let rgb;
        if(world.tick<120){
          const heat=1-world.tick/120;
          rgb=land?[Math.round(110+120*heat+45*heightTone),Math.round(51+28*heightTone),26]:
            [Math.round(49+100*heat),32,40];
        }else if(!land){
          const shallow=Math.max(0,Math.min(1,(cell.elevation+0.24)*1.3));
          rgb=[8+16*shallow,52+42*shallow,102+43*shallow];
        }else if(icy){rgb=[210,224,235];}
        else if(landscape){rgb=[
          112-62*green+25*heightTone,
          102+45*green+30*heightTone,
          67+20*green+20*heightTone];
        }else{rgb=[123+28*heightTone,105+24*heightTone,79+15*heightTone]}
        const k=(y*width+x)*4;
        out[k]=rgb[0];out[k+1]=rgb[1];out[k+2]=rgb[2];out[k+3]=255;
      }
    }
    this.ctx.putImageData(pixels,0,0);this.texture.needsUpdate=true;
    this.atmosphere.material.opacity=world.tick<120?.02:.12;
    this.cloudLayer.material.opacity=world.tick<120?0:.035;
  }
  clearLayer(layer){
    for(const obj of [...layer.children]){
      layer.remove(obj);
      obj.geometry?.dispose();obj.material?.dispose();
    }
  }
  drawMarkers(world){
    this.clearLayer(this.lifeLayer);this.clearLayer(this.cityLayer);
    const typeColors={microbe:0x69cbd8,plant:0x76ed83,grazer:0xfbe0a1,predator:0xff9862,hominin:0xf6dbe0};
    const layers=["microbe","plant","grazer","predator","hominin"];
    for(const type of layers){
      const cells=world.cells.filter(c=>world.regions[c.i][type]>.20);
      if(!cells.length)continue;
      const maximum=type==="microbe"?120:155;
      const shown=cells.sort((a,b)=>world.regions[b.i][type]-world.regions[a.i][type]).slice(0,maximum);
      const geo=new THREE.SphereGeometry(type==="hominin"?.023:.012,5,4);
      const material=new THREE.MeshBasicMaterial({color:typeColors[type],transparent:true,opacity:.84});
      const mesh=new THREE.InstancedMesh(geo,material,shown.length);
      const obj=new THREE.Object3D();
      for(let i=0;i<shown.length;i++){
        obj.position.copy(this.surfacePosition(shown[i].lon,shown[i].lat,2.368));
        obj.scale.setScalar(Math.min(2.4,1+Math.log1p(world.regions[shown[i].i][type])*.12));
        obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);
      }
      mesh.instanceMatrix.needsUpdate=true;this.lifeLayer.add(mesh);
    }
    const cities=world.settlements.filter(s=>s.population>2).slice(0,24);
    if(cities.length){
      const geometry=new THREE.SphereGeometry(.034,8,6);
      const material=new THREE.MeshBasicMaterial({color:0xffd878});
      const mesh=new THREE.InstancedMesh(geometry,material,cities.length),obj=new THREE.Object3D();
      for(let i=0;i<cities.length;i++){
        const cell=world.cells[cities[i].i];
        obj.position.copy(this.surfacePosition(cell.lon,cell.lat,2.41));
        obj.scale.setScalar(.7+Math.min(2.3,Math.log1p(cities[i].population)/4));
        obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);
      }
      mesh.instanceMatrix.needsUpdate=true;this.cityLayer.add(mesh);
    }
  }
  resize(){
    const w=this.viewport.clientWidth,h=this.viewport.clientHeight;
    if(w<1||h<1)return;
    this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
    this.renderer.setSize(w,h,false);
  }
  frame(now){
    if(!this.running)return;
    const dt=Math.min(.08,(now-this.previous)/1000);this.previous=now;
    this.root.rotation.y+=dt*.022;this.cloudLayer.rotation.y+=dt*.025;
    this.controls.update();this.renderer.render(this.scene,this.camera);
    requestAnimationFrame(this.frame);
  }
  dispose(){
    this.running=false;this.resizeObserver.disconnect();
    this.clearLayer(this.lifeLayer);this.clearLayer(this.cityLayer);
    this.controls.dispose();this.renderer.dispose();this.texture.dispose();
  }
}
