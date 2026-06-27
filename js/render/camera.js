'use strict';
// Camera orbitale con vincoli
APP.camera = (function() {
  'use strict';
  var cfg = APP.config;
  var cam = cfg.camera;

  function getViewMatrix() {
    return APP.math.MakeView(cam.cx, cam.cy, cam.cz, cam.elevation, cam.angle);
  }

  function orbit(deltaAngle, deltaElevation) {
    cam.angle += deltaAngle;
    cam.elevation += deltaElevation;
    if (cam.elevation > cam.maxElevation) cam.elevation = cam.maxElevation;
    if (cam.elevation < cam.minElevation) cam.elevation = cam.minElevation;
  }

  function pan(dx, dy, dz) { cam.cx += dx; cam.cy += dy; cam.cz += dz; }

  function zoom(delta) {
    cfg.rendering.fieldOfViewDeg -= delta;
    if (cfg.rendering.fieldOfViewDeg > 170) cfg.rendering.fieldOfViewDeg = 170;
    if (cfg.rendering.fieldOfViewDeg < 5) cfg.rendering.fieldOfViewDeg = 5;
  }

  function getEyePosition() { return [0.0, 0.0, 0.0]; }

  return {
    getViewMatrix: getViewMatrix,
    orbit: orbit,
    pan: pan,
    zoom: zoom,
    getEyePosition: getEyePosition
  };
})();
