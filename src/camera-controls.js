// Unified precision navigation for globe and terrain.
// Residual glide is the fraction left for subsequent 60 Hz frames (0–5%).
// This is an input-response tuning setting, not a claim of measured positional accuracy.
export const DEFAULT_CAMERA_GLIDE = 2;
export const CAMERA_GLIDE_CHOICES = [0, 2, 5];

export function normalizeCameraGlide(value) {
  const amount = Number(value);
  return CAMERA_GLIDE_CHOICES.includes(amount) ? amount : DEFAULT_CAMERA_GLIDE;
}

export function setCameraGlide(controls, value) {
  const residual = normalizeCameraGlide(value);
  // OrbitControls distributes one input over multiple update() frames when damping
  // is enabled. A 0.98 damping factor applies 98% on the first 60 Hz update.
  controls.enableDamping = residual > 0;
  controls.dampingFactor = 1 - residual / 100;
  return residual;
}

export function configurePrecisionCamera(controls, kind = "surface", glide = DEFAULT_CAMERA_GLIDE) {
  if (kind !== "surface" && kind !== "planet") {
    throw new Error("Unknown camera mode");
  }
  setCameraGlide(controls, glide);
  controls.enableRotate = true;
  controls.enableZoom = true;
  controls.enablePan = true;
  // Left button moves the world; right button changes viewpoint.
  // Match Three.js mouse action IDs: ROTATE=0, DOLLY=1, PAN=2.
  controls.mouseButtons = {LEFT:2,MIDDLE:1,RIGHT:0};
  controls.touches = {ONE:0,TWO:2};
  controls.autoRotate = false;
  controls.zoomToCursor = true;
  controls.rotateSpeed = kind === "surface" ? .72 : .7;
  controls.panSpeed = kind === "surface" ? .82 : .58;
  controls.zoomSpeed = kind === "surface" ? .85 : .82;
  // Ground-level panning remains parallel to the local terrain's XZ plane.
  controls.screenSpacePanning = kind === "planet";
  controls.keyPanSpeed = 6;
  // Constrain panning and zoom-to-cursor focus, without preventing orbiting.
  controls.minTargetRadius = 0;
  controls.maxTargetRadius = kind === "planet" ? .9 : 10000;
  controls.cursor.set(0, 0, 0);
  return controls;
}

export function confineSurfaceTarget(controls, camera, halfSize = 83, ceiling = 38) {
  const t = controls.target;
  const x = Math.max(-halfSize, Math.min(halfSize, t.x));
  const z = Math.max(-halfSize, Math.min(halfSize, t.z));
  const y = Math.max(-80, Math.min(ceiling, t.y));
  const dx = x - t.x, dy = y - t.y, dz = z - t.z;
  if (dx || dy || dz) {
    // Move camera and focus together: no view-angle jump or rubber-band bounce.
    t.set(x, y, z);
    camera.position.x += dx;
    camera.position.y += dy;
    camera.position.z += dz;
  }
  return Boolean(dx || dy || dz);
}
