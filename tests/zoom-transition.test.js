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
 assert.match(app,/view\.camera\.position\.length\(\)<=4\.6/);
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
