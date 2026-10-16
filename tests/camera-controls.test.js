import test from "node:test";
import assert from "node:assert/strict";
import {configurePrecisionCamera,normalizeCameraGlide,setCameraGlide,
  confineSurfaceTarget,CAMERA_GLIDE_CHOICES} from "../src/camera-controls.js";

function fakeControls(){
  return {cursor:{set(x,y,z){this.x=x;this.y=y;this.z=z}},
    target:{x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z}}};
}
test("navigation offers exactly zero, two and five percent residual glide",()=>{
 assert.deepEqual(CAMERA_GLIDE_CHOICES,[0,2,5]);
 assert.equal(normalizeCameraGlide("2"),2);
 assert.equal(normalizeCameraGlide("5"),5);
 assert.equal(normalizeCameraGlide(999),2);
});
test("precise mode applies 98 percent of an input on the first damped update",()=>{
 const c=configurePrecisionCamera(fakeControls(),"planet");
 assert.equal(c.enableDamping,true);
 assert.equal(c.dampingFactor,.98);
 assert.equal(c.zoomToCursor,true);
 assert.equal(c.enablePan,true);
 assert.equal(c.autoRotate,false);
});
test("no glide mode disables inertia completely",()=>{
 const c=configurePrecisionCamera(fakeControls(),"surface",0);
 assert.equal(c.enableDamping,false);
 assert.equal(c.dampingFactor,1);
 assert.equal(c.screenSpacePanning,false);
 setCameraGlide(c,5);
 assert.equal(c.enableDamping,true);
 assert.equal(c.dampingFactor,.95);
});
test("terrain panning clamps target without changing camera-relative orientation",()=>{
 const c=fakeControls(),camera={position:{x:90,y:24,z:100}};
 c.target.set(90,55,-91);
 assert.equal(confineSurfaceTarget(c,camera),true);
 assert.deepEqual([c.target.x,c.target.y,c.target.z],[83,38,-83]);
 assert.deepEqual([camera.position.x,camera.position.y,camera.position.z],[83,7,108]);
 assert.equal(confineSurfaceTarget(c,camera),false);
});
