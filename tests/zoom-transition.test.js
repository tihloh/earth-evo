import test from "node:test";
import assert from "node:assert/strict";
import {PLANET_TO_SURFACE_DISTANCE,SURFACE_TO_PLANET_DISTANCE,
  ZOOM_CROSSFADE_MS,enterSurfaceAt,returnPlanetAt,smoothBlend}
from "../src/zoom-transition.js";
import {readFileSync} from "node:fs";
const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
const scene=readFileSync(new URL("../src/surface-view.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/styles.css",import.meta.url),"utf8");
test("hysteresis prevents oscillating between geographic scales",()=>{
 assert.ok(SURFACE_TO_PLANET_DISTANCE>PLANET_TO_SURFACE_DISTANCE);
 assert.equal(enterSurfaceAt(3.6,false),true);
 assert.equal(enterSurfaceAt(4.35,false),true);
 assert.equal(enterSurfaceAt(4.7,false),false);
 assert.equal(enterSurfaceAt(3.5,true),false);
 assert.equal(returnPlanetAt(158,true,true),true);
 assert.equal(returnPlanetAt(158,false,true),false);
 assert.equal(returnPlanetAt(150,true,true),false);
 assert.equal(returnPlanetAt(158,true,false),false);
 assert.ok(ZOOM_CROSSFADE_MS>=200&&ZOOM_CROSSFADE_MS<=900);
});
test("blend easing is bounded and smooth at start and finish",()=>{
 assert.equal(smoothBlend(-2),0);
 assert.equal(smoothBlend(0),0);
 assert.equal(smoothBlend(.5),.5);
 assert.equal(smoothBlend(1),1);
 assert.equal(smoothBlend(2),1);
});
test("zoom transition is wired to both globe and surface",()=>{
 assert.match(app,/enterSurfaceAt\(Math\.min\(/);
 assert.match(app,/\$\("globe"\)\.addEventListener\("wheel"/);
 assert.match(app,/continuousZoom\.wheel\(event\.deltaY,event\.deltaMode,distance\)/);
 assert.match(app,/zoomTransitionBusy/);
 assert.match(app,/Terrain zoom failed:/);
 assert.match(scene,/returnPlanetAt\(this\.camera\.position\.distanceTo/);
 assert.match(app,/alignSurfaceCamera\(\)/);
 assert.match(app,/alignPlanetCamera\(\)/);
 assert.match(app,/blendWorldView\(true\)/);
 assert.match(app,/blendWorldView\(false\)/);
 assert.match(css,/body\.world-surface #surfaceViewport/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test("zoom switch occurs before orbit camera bottoms out",()=>{
 assert.ok(PLANET_TO_SURFACE_DISTANCE>3.3);
 assert.equal(enterSurfaceAt(4.4),true);
 assert.equal(enterSurfaceAt(7.9),false);
});

test("scrolling continues beyond the globe limit to activate terrain LOD",async()=>{
 const {ZoomContinuum,wheelPixels,tileSegments,globeSurfaceBlend}=
   await import("../src/zoom-continuum.js");
 assert.equal(wheelPixels(-3,1),-48);
 assert.equal(wheelPixels(-1,2),-640+40);
 const zoom=new ZoomContinuum();
 for(let i=0;i<10;i++)zoom.wheel(-80,0,7.9);
 assert.ok(zoom.shouldEnter(7.9));
 zoom.reset();
 assert.equal(zoom.shouldEnter(7.9),false);
 assert.equal(tileSegments(0,12),64);
 assert.equal(tileSegments(20,80),32);
 assert.equal(tileSegments(110,80),16);
 assert.equal(tileSegments(200,80),8);
 assert.equal(tileSegments(400,80),4);
 assert.equal(globeSurfaceBlend(.7),0);
 assert.equal(globeSurfaceBlend(1),1);
});
