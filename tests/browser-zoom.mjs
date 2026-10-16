// Real Chromium WebGL smoke test. Unlike static source tests, this exercises the
// actual canvas, OrbitControls wheel events and the globe->terrain handoff.
import { chromium } from "playwright";
import assert from "node:assert/strict";

const browser=await chromium.launch({
  headless:true,
  args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--enable-webgl","--disable-dev-shm-usage"]
});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[],warn=[];
page.on("pageerror",e=>errors.push(String(e)));
page.on("console",m=>{
  if(m.type()==="error"&&!/WebGL.*performance caveat|GL Driver Message/.test(m.text()))
    warn.push(m.text());
});
const url=process.env.EARTH_EVO_URL||"http://127.0.0.1:8000";
try{
  await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
  await page.waitForSelector("#globe",{state:"visible"});
  await page.waitForTimeout(900);
  const element=page.locator("#globe");
  const area=await element.boundingBox();
  assert.ok(area&&area.width>100&&area.height>100,"globe canvas must be visible");
  await page.mouse.move(area.x+area.width/2,area.y+area.height/2);
  const isSurface=()=>page.evaluate(()=>document.body.classList.contains("world-surface"));
  for(let i=0;i<18&&!await isSurface();i++){
    await page.mouse.wheel(0,-95);
    await page.waitForTimeout(110);
  }
  await page.waitForFunction(()=>document.body.classList.contains("world-surface"),
    {timeout:30000}).catch(async()=>{
      const status=await page.locator("#status").textContent();
      throw Error("Unable to zoom from globe: "+status+"; JS errors: "+errors.join("|"));
    });
  await page.waitForTimeout(900);
  assert.equal(await page.locator("#surfaceViewport").isVisible(),true,
    "detailed landscape should be visible after inward wheel zoom");
  const status=await page.locator("#status").textContent();
  assert.ok(!status?.includes("Terrain zoom failed:"),"scene initialization: "+status);
  assert.deepEqual(errors,[],"no runtime exceptions while opening terrain");
  console.log("PASS: Globe wheel zoom enters rendered living regional world");
  // Outward wheel should eventually restore the globe without an explicit button.
  const surface=await page.locator("#surface").boundingBox();
  assert.ok(surface);
  await page.mouse.move(surface.x+surface.width*.5,surface.y+surface.height*.5);
  for(let i=0;i<24&&await isSurface();i++){
    await page.mouse.wheel(0,140);
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(700);
  assert.equal(await isSurface(),false,"zoom out must return to the globe");
  assert.equal(await page.locator("#globeViewport").isVisible(),true);
  assert.deepEqual(errors,[],"no browser JS exceptions during return trip");
  console.log("PASS: Surface zoom out restores globe with no scene errors");
  if(warn.length)console.log("Non-fatal browser console:",warn.slice(0,4));
}catch(error){
  const diagnostics=await page.locator("#status").textContent().catch(()=>"");
  console.error("Browser diagnostics:",JSON.stringify({errors,warn:warn.slice(0,5),diagnostics}));
  await page.screenshot({path:"/tmp/earth-evo-zoom-failed.png"}).catch(()=>{});
  throw error;
}finally{await browser.close()}
