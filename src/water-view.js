// A single animated ocean for the whole visible region. Chunk-sized transparent
// ocean quads used to make bright rectangular plates and expose water tile seams.
import * as THREE from "three";
export const OCEAN_SURFACE_SIZE=2200;
export const OCEAN_LEVEL=.018;
export function createOceanSurface(){
  const geometry=new THREE.PlaneGeometry(OCEAN_SURFACE_SIZE,OCEAN_SURFACE_SIZE,1,1);
  geometry.rotateX(-Math.PI/2);
  const material=new THREE.MeshStandardMaterial({
    color:0x397e9b,roughness:.52,metalness:.03,
    transparent:false,depthWrite:true,side:THREE.DoubleSide
  });
  const wave={value:0};
  material.onBeforeCompile=shader=>{
    shader.uniforms.uOceanTime=wave;
    shader.vertexShader="varying vec3 vOceanWorld;\n"+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace(
      "#include <worldpos_vertex>",
      "#include <worldpos_vertex>\nvOceanWorld=(modelMatrix*vec4(transformed,1.0)).xyz;"
    );
    shader.fragmentShader="varying vec3 vOceanWorld;\nuniform float uOceanTime;\n"+
      shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace(
      "#include <color_fragment>",
      "#include <color_fragment>\n"+
      "float swell=sin(vOceanWorld.x*.14+uOceanTime*.65)*cos(vOceanWorld.z*.12-uOceanTime*.40);\n"+
      "float ripples=sin(vOceanWorld.x*.78+vOceanWorld.z*.33+uOceanTime*1.4)*"+
      "sin(vOceanWorld.z*.61-vOceanWorld.x*.20-uOceanTime*1.1);\n"+
      "float shimmer=clamp(.53+.23*swell+.11*ripples,0.2,1.0);\n"+
      "diffuseColor.rgb*=mix(.86,1.12,shimmer);\n"
    );
  };
  material.customProgramCacheKey=()=>"earth-evo-ocean-v2";
  const ocean=new THREE.Mesh(geometry,material);
  ocean.name="Continuous ocean";
  ocean.position.y=OCEAN_LEVEL;
  ocean.frustumCulled=false;
  ocean.receiveShadow=false;
  ocean.userData.wave=wave;
  return ocean;
}
export function updateOceanSurface(ocean,target,time){
  if(!ocean)return;
  ocean.position.x=Math.round(target.x/48)*48;
  ocean.position.z=Math.round(target.z/48)*48;
  ocean.userData.wave.value=time;
}
