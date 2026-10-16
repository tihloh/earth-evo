// Camera thresholds are separated so wheel zoom does not oscillate between scales.
export const PLANET_TO_SURFACE_DISTANCE = 4.45;
export const SURFACE_TO_PLANET_DISTANCE = 157;
export const ZOOM_CROSSFADE_MS = 540;

export function enterSurfaceAt(distance, alreadyThere = false) {
  return !alreadyThere && Number.isFinite(distance) && distance <= PLANET_TO_SURFACE_DISTANCE;
}
export function returnPlanetAt(distance, onSurface = false, zoomingOut = false) {
  return onSurface && zoomingOut && Number.isFinite(distance) &&
    distance >= SURFACE_TO_PLANET_DISTANCE;
}
export function smoothBlend(progress) {
  const p=Math.max(0,Math.min(1,Number(progress)||0));
  return p*p*(3-2*p);
}
