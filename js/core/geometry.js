'use strict';
// Generazione geometrie procedurali + hardcoded
APP.geometry = (function() {
  'use strict';

  function createSphere(radius, resolution) {
    var vertices = [];
    var normals = [];
    var indices = [];
    var i, j, theta, phi, x, y, z, nx, ny, nz;

    for (i = 0; i <= resolution; i++) {
      for (j = 0; j <= resolution; j++) {
        theta = 2 * Math.PI * i / resolution;
        phi = Math.PI * j / resolution;
        x = radius * Math.sin(phi) * Math.cos(theta);
        y = radius * Math.sin(phi) * Math.sin(theta);
        z = radius * Math.cos(phi);
        nx = Math.sin(phi) * Math.cos(theta);
        ny = Math.sin(phi) * Math.sin(theta);
        nz = Math.cos(phi);
        vertices.push([x, y, z]);
        normals.push([nx, ny, nz]);
      }
    }
    for (i = 0; i < resolution; i++) {
      for (j = 0; j < resolution; j++) {
        indices[6 * (i * resolution + j)]     = (resolution + 1) * j + i;
        indices[6 * (i * resolution + j) + 1] = (resolution + 1) * j + i + 1;
        indices[6 * (i * resolution + j) + 2] = (resolution + 1) * (j + 1) + i + 1;
        indices[6 * (i * resolution + j) + 3] = (resolution + 1) * j + i;
        indices[6 * (i * resolution + j) + 4] = (resolution + 1) * (j + 1) + i + 1;
        indices[6 * (i * resolution + j) + 5] = (resolution + 1) * (j + 1) + i;
      }
    }
    return { vertices: vertices, normals: normals, indices: indices };
  }

  function createCube() {
    var vertices = [
      -1.0,-1.0,1.0,   1.0,-1.0,1.0,   1.0,1.0,1.0,   -1.0,1.0,1.0,
      -1.0,-1.0,-1.0,  1.0,-1.0,-1.0,  1.0,1.0,-1.0,  -1.0,1.0,-1.0,
      1.0,-1.0,1.0,    1.0,-1.0,-1.0,  1.0,1.0,-1.0,   1.0,1.0,1.0,
      -1.0,-1.0,-1.0, -1.0,-1.0,1.0,  -1.0,1.0,1.0,   -1.0,1.0,-1.0,
      -1.0,1.0,1.0,    1.0,1.0,1.0,    1.0,1.0,-1.0,  -1.0,1.0,-1.0,
      -1.0,-1.0,1.0,   1.0,-1.0,1.0,   1.0,-1.0,-1.0, -1.0,-1.0,-1.0
    ];
    var normals = [
      0,0,1, 0,0,1, 0,0,1, 0,0,1,
      0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
      1,0,0, 1,0,0, 1,0,0, 1,0,0,
      -1,0,0, -1,0,0, -1,0,0, -1,0,0,
      0,1,0, 0,1,0, 0,1,0, 0,1,0,
      0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0
    ];
    var indices = [
      0,1,2, 0,2,3, 5,4,7, 5,7,6,
      8,9,10, 8,10,11, 12,13,14, 12,14,15,
      16,17,18, 16,18,19, 20,22,21, 20,23,22
    ];
    var uvs = [
      1,0, 1,1, 0.75,1, 0.75,0,
      1,0, 1,1, 0.75,1, 0.75,0,
      1,0, 1,1, 0.75,1, 0.75,0,
      0,0.75, 1,0.75, 1,1, 0,1,
      1,0, 1,1, 0,1, 0,0,
      1,0, 1,1, 0,1, 0,0
    ];
    return { vertices: vertices, normals: normals, indices: indices, uvs: uvs };
  }

  return {
    createSphere: createSphere,
    createCube: createCube
  };
})();
