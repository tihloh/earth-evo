import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {W,H} from "./simulation.js";
import {sampleGeography,globeUVToGeo,globeColor,SEA_LEVEL} from "./geography.js";
import {configurePrecisionCamera,setCameraGlide} from "./camera-controls.js";

export class PlanetView {
  constructor(canvas,viewport){
    this.canvas=canvas;this.viewport=viewport;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x07121f);
    this.camera=new THREE.PerspectiveCamera(43,1,.1,170);this.camera.position.set(0,1.2,7.9);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.controls=new OrbitControls(this.camera,canvas);
    configurePrecisionCamera(this.controls,"planet",2);
    this.controls.minDistance=3.3;this.controls.maxDistance=12;
    this.root=new THREE.Group();this.scene.add(this.root);
    this.scene.add(new THREE.AmbientLight(0xb1c8e4,1.55));
    const sun=new THREE.DirectionalLight(0xffe9c9,3.4);sun.position.set(5,4,7);this.scene.add(sun);
    const w=1536,h=768;this.textureCanvas=document.createElement("canvas");this.textureCanvas.width=w;this.textureCanvas.height=h;
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
    this.lastSurface="";this.lastMarkers=-1;this.geographyCache=null;
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(viewport);
    this.resize();
    this.previous=performance.now();this.running=true;this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);
  }
  setGlide(value){setCameraGlide(this.controls,value)}
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
    const size=width*height;
    if(!this.geographyCache||this.geographyCache.seed!==world.seed){
      const samples=new Float32Array(size),moisture=new Float32Array(size),
        temperatures=new Float32Array(size),channels=new Float32Array(size),latitudes=new Float32Array(height);
      for(let y=0;y<height;y++){
        const {lat}=globeUVToGeo(0,(y+.5)/height);
        latitudes[y]=lat;
        for(let x=0;x<width;x++){
          const {lon}=globeUVToGeo((x+.5)/width,(y+.5)/height);
          const s=sampleGeography(lat,lon,world.seed,0),index=y*width+x;
          samples[index]=s.elevation;moisture[index]=s.moisture;
          temperatures[index]=s.temperature;channels[index]=s.channel;
        }
      }
      this.geographyCache={seed:world.seed,samples,moisture,temperatures,channels,latitudes};
    }
    const geo=this.geographyCache;
    const image=this.ctx.createImageData(width,height),pixels=image.data;
    const seaLevel=SEA_LEVEL+world.seaShift*.5,era=world.tick;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const i=y*width+x,elevation=geo.samples[i],land=elevation>seaLevel,
        h=(elevation-seaLevel)*17.5,latitude=Math.abs(geo.latitudes[y]),
        moist=geo.moisture[i],temp=geo.temperatures[i];
      const sample={land,height:h,ice:land&&(latitude>74||temp<-8),
        river:land&&moist>.45&&h<8&&geo.channels[i]<.075,moisture:moist,
        biome:!land?"ocean":h>8?"alpine":moist>.65?"forest":moist<.35?"dryland":"grassland"};
      const rgb=globeColor(sample,era);
      // Relief shading is computed from the same elevation samples, not a separate map.
      const nX=x===width-1?y*width:y*width+x+1;
      const shade=Math.max(.76,Math.min(1.20,.98+(geo.samples[nX]-elevation)*2.9));
      const p=i*4;
      pixels[p]=rgb[0]*shade;pixels[p+1]=rgb[1]*shade;
      pixels[p+2]=rgb[2]*shade;pixels[p+3]=255;
    }
    this.ctx.putImageData(image,0,0);this.texture.needsUpdate=true;
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
    // No idle drift: the Earth stays still when the user stops dragging.
    this.controls.update();this.renderer.render(this.scene,this.camera);
    requestAnimationFrame(this.frame);
  }
  dispose(){
    this.running=false;this.resizeObserver.disconnect();
    this.clearLayer(this.lifeLayer);this.clearLayer(this.cityLayer);
    this.controls.dispose();this.renderer.dispose();this.texture.dispose();
  }
}
