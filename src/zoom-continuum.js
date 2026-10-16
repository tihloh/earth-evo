// View-independent, device-normalized zoom intent. OrbitControls can clamp
// at the planet surface, but accumulated inward intent continues across scales.
// Every render scale samples the same geographic lat/lon elevation field.
export const ZOOM_IN_TARGET = 1;
export const SURFACE_REENTRY_LIMIT = 160;
export const CONTINUUM_VERSION = 1;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function wheelPixels(deltaY, deltaMode=0){
  if(!Number.isFinite(deltaY))return 0;
  // DOM_DELTA_LINE=1; DOM_DELTA_PAGE=2
  return clamp(deltaY*(deltaMode===1?16:deltaMode===2?640:1),-600,600);
}
export function zoomFraction(distance,far=7.9,near=3.3){
  if(!Number.isFinite(distance))return 0;
  return clamp(Math.log(far/Math.max(distance,.1))/Math.log(far/near),0,1);
}
export class ZoomContinuum {
  constructor(){this.intent=0;this.direction=0}
  wheel(deltaY,deltaMode=0,cameraDistance=7.9){
    const pixels=wheelPixels(deltaY,deltaMode);
    if(!pixels)return this.progress(cameraDistance);
    this.direction=Math.sign(pixels);
    this.intent=clamp(this.intent-pixels/440,0,1.3);
    return this.progress(cameraDistance);
  }
  progress(cameraDistance){
    // The stronger signal wins: a native camera zoom or a trackpad/scroll-wheel
    // gesture. Neither can silently hit a hard stop below the triggering value.
    return Math.max(this.intent,zoomFraction(cameraDistance));
  }
  shouldEnter(cameraDistance){return this.progress(cameraDistance)>=ZOOM_IN_TARGET}
  reset(){this.intent=0;this.direction=0}
}
export function tileSegments(distanceToTile,zoomDistance){
  // Parent/child grids share vertices (powers of two), avoiding discontinuities
  // when detail is refined from the exact same geographic sampler.
  const d=Math.max(0,distanceToTile),eye=Math.max(0,zoomDistance);
  if(d<36&&eye<38)return 64;
  if(d<85)return 32;
  if(d<150)return 16;
  if(d<235)return 8;
  return 4;
}
export function globeSurfaceBlend(progress){
  const t=clamp((progress-.75)/.25,0,1);
  return t*t*(3-2*t);
}
