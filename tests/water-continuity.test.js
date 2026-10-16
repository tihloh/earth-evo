import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {waterSignal,waterSurfaceHeight,clipWaterTriangle} from "../src/water-geometry.js";
import {sampleGeography,findScenicLocation} from "../src/geography.js";

test("ocean always uses one plane and never creates rectangular chunk water sheets",()=>{
 const source=readFileSync(new URL("../src/surface-view.js",import.meta.url),"utf8");
 const water=readFileSync(new URL("../src/water-view.js",import.meta.url),"utf8");
 assert.match(source,/this\.ocean=this\.world\.era>=120\?createOceanSurface\(\):null/);
 assert.match(source,/updateOceanSurface\(this\.ocean/);
 assert.doesNotMatch(source,/new THREE\.PlaneGeometry\(size,size\)/);
 assert.match(water,/OCEAN_SURFACE_SIZE=2200/);
 assert.match(water,/transparent:false,depthWrite:true/);
});

test("freshwater clipping excludes entirely dry triangles",()=>{
 const a={x:0,y:1,z:0,w:-1},b={x:1,y:1,z:0,w:-.5},
   c={x:0,y:1,z:1,w:-.1};
 assert.deepEqual(clipWaterTriangle(a,b,c),[]);
});

test("freshwater clipping makes edge triangles rather than whole squares",()=>{
 const a={x:0,y:2,z:0,w:1},b={x:2,y:2,z:0,w:-1},
   c={x:0,y:2,z:2,w:1};
 const vertices=clipWaterTriangle(a,b,c);
 assert.equal(vertices.length,6);
 assert.ok(vertices.every(p=>p.x>=0&&p.x<=2&&p.z>=0&&p.z<=2));
 assert.ok(vertices.some(p=>p.x===1&&p.z===0));
 assert.ok(vertices.some(p=>p.x===1&&p.z===1));
 const onlyWet=clipWaterTriangle(a,{...b,w:1},{...c,w:1});
 assert.equal(onlyWet.length,3);
});

test("water classification keeps ocean under the zero-level land threshold",()=>{
 const water=sampleGeography(5,0,42);
 assert.ok(!water.land);
 assert.ok(waterSignal(water)<0,"ocean should not create inland river polygons");
 const site=findScenicLocation("lake",42);
 const lake=sampleGeography(site.lat,site.lon,42);
 assert.equal(lake.waterKind,"lake");
 assert.ok(waterSignal(lake)>0);
 assert.ok(waterSurfaceHeight(lake)>lake.height);
});
