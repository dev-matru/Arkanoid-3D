'use strict';
// Modulo di algebra lineare 3D — estratto da utils.js
APP.math = (function() {
  'use strict';

  function degToRad(angle) {
    return angle * Math.PI / 180;
  }

  function identityMatrix() {
    return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
  }

  function identityMatrix3() {
    return [1,0,0, 0,1,0, 0,0,1];
  }

  function sub3x3from4x4(m) {
    var out = [];
    out[0] = m[0]; out[1] = m[1]; out[2] = m[2];
    out[3] = m[4]; out[4] = m[5]; out[5] = m[6];
    out[6] = m[8]; out[7] = m[9]; out[8] = m[10];
    return out;
  }

  function multiplyMatrix3Vector3(m, a) {
    var out = [];
    var x = a[0], y = a[1], z = a[2];
    out[0] = x * m[0] + y * m[1] + z * m[2];
    out[1] = x * m[3] + y * m[4] + z * m[5];
    out[2] = x * m[6] + y * m[7] + z * m[8];
    return out;
  }

  function transposeMatrix3(a) {
    var out = [];
    out[0] = a[0]; out[1] = a[3]; out[2] = a[6];
    out[3] = a[1]; out[4] = a[4]; out[5] = a[7];
    out[6] = a[2]; out[7] = a[5]; out[8] = a[8];
    return out;
  }

  function invertMatrix(m) {
    var out = [];
    var inv = [];
    var det, i;

    inv[0] = m[5]  * m[10] * m[15] - m[5]  * m[11] * m[14] - m[9]  * m[6]  * m[15] +
             m[9]  * m[7]  * m[14] + m[13] * m[6]  * m[11] - m[13] * m[7]  * m[10];
    inv[4] = -m[4]  * m[10] * m[15] + m[4]  * m[11] * m[14] + m[8]  * m[6]  * m[15] -
              m[8]  * m[7]  * m[14] - m[12] * m[6]  * m[11] + m[12] * m[7]  * m[10];
    inv[8] = m[4]  * m[9] * m[15] - m[4]  * m[11] * m[13] - m[8]  * m[5] * m[15] +
             m[8]  * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
    inv[12] = -m[4]  * m[9] * m[14] + m[4]  * m[10] * m[13] + m[8]  * m[5] * m[14] -
               m[8]  * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
    inv[1] = -m[1]  * m[10] * m[15] + m[1]  * m[11] * m[14] + m[9]  * m[2] * m[15] -
              m[9]  * m[3] * m[14] - m[13] * m[2] * m[11] +  m[13] * m[3] * m[10];
    inv[5] = m[0]  * m[10] * m[15] - m[0]  * m[11] * m[14] - m[8]  * m[2] * m[15] +
             m[8]  * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
    inv[9] = -m[0]  * m[9] * m[15] + m[0]  * m[11] * m[13] + m[8]  * m[1] * m[15] -
              m[8]  * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
    inv[13] = m[0]  * m[9] * m[14] - m[0]  * m[10] * m[13] - m[8]  * m[1] * m[14] +
              m[8]  * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
    inv[2] = m[1]  * m[6] * m[15] - m[1]  * m[7] * m[14] - m[5]  * m[2] * m[15] +
             m[5]  * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
    inv[6] = -m[0]  * m[6] * m[15] + m[0]  * m[7] * m[14] + m[4]  * m[2] * m[15] -
              m[4]  * m[3] * m[14] - m[12] * m[2] * m[7] +  m[12] * m[3] * m[6];
    inv[10] = m[0]  * m[5] * m[15] - m[0]  * m[7] * m[13] - m[4]  * m[1] * m[15] +
              m[4]  * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
    inv[14] = -m[0]  * m[5] * m[14] + m[0]  * m[6] * m[13] + m[4]  * m[1] * m[14] -
               m[4]  * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
    inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] -
              m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
    inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] +
             m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
    inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] -
               m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
    inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] +
              m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];
    det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
    if (det === 0) return identityMatrix();
    det = 1.0 / det;
    for (i = 0; i < 16; i++) { out[i] = inv[i] * det; }
    return out;
  }

  function transposeMatrix(m) {
    var out = [], row, column, row_offset;
    row_offset = 0;
    for (row = 0; row < 4; ++row) {
      row_offset = row * 4;
      for (column = 0; column < 4; ++column)
        out[row_offset + column] = m[row + column * 4];
    }
    return out;
  }

  function multiplyMatrices(m1, m2) {
    var out = [], row, column, row_offset;
    row_offset = 0;
    for (row = 0; row < 4; ++row) {
      row_offset = row * 4;
      for (column = 0; column < 4; ++column) {
        out[row_offset + column] =
          (m1[row_offset + 0] * m2[column + 0]) +
          (m1[row_offset + 1] * m2[column + 4]) +
          (m1[row_offset + 2] * m2[column + 8]) +
          (m1[row_offset + 3] * m2[column + 12]);
      }
    }
    return out;
  }

  function multiplyMatrixVector(m, v) {
    var out = [], row, row_offset;
    row_offset = 0;
    for (row = 0; row < 4; ++row) {
      row_offset = row * 4;
      out[row] =
        (m[row_offset + 0] * v[0]) +
        (m[row_offset + 1] * v[1]) +
        (m[row_offset + 2] * v[2]) +
        (m[row_offset + 3] * v[3]);
    }
    return out;
  }

  function MakeTranslateMatrix(dx, dy, dz) {
    var out = identityMatrix();
    out[3] = dx; out[7] = dy; out[11] = dz;
    return out;
  }

  function MakeRotateXMatrix(a) {
    var out = identityMatrix();
    var adeg = degToRad(a);
    var c = Math.cos(adeg), s = Math.sin(adeg);
    out[5] = out[10] = c; out[6] = -s; out[9] = s;
    return out;
  }

  function MakeRotateYMatrix(a) {
    var out = identityMatrix();
    var adeg = degToRad(a);
    var c = Math.cos(adeg), s = Math.sin(adeg);
    out[0] = out[10] = c; out[2] = -s; out[8] = s;
    return out;
  }

  function MakeRotateZMatrix(a) {
    var out = identityMatrix();
    var adeg = degToRad(a);
    var c = Math.cos(adeg), s = Math.sin(adeg);
    out[0] = out[5] = c; out[4] = -s; out[1] = s;
    return out;
  }

  function MakeScaleMatrix(s) {
    var out = identityMatrix();
    out[0] = out[5] = out[10] = s;
    return out;
  }

  function MakeScaleMatrixGeneric(sx, sy, sz) {
    var out = identityMatrix();
    out[0] = sx; out[5] = sy; out[10] = sz;
    return out;
  }

  function MakeWorld(tx, ty, tz, rx, ry, rz, s) {
    var Rx = MakeRotateXMatrix(rx);
    var Ry = MakeRotateYMatrix(ry);
    var Rz = MakeRotateZMatrix(rz);
    var S  = MakeScaleMatrix(s);
    var T  = MakeTranslateMatrix(tx, ty, tz);
    var out = multiplyMatrices(Rz, S);
    out = multiplyMatrices(Ry, out);
    out = multiplyMatrices(Rx, out);
    out = multiplyMatrices(T, out);
    return out;
  }

  function MakeWorldGeneric(tx, ty, tz, rx, ry, rz, sx, sy, sz) {
    var Rx = MakeRotateXMatrix(rx);
    var Ry = MakeRotateYMatrix(ry);
    var Rz = MakeRotateZMatrix(rz);
    var S  = MakeScaleMatrixGeneric(sx, sy, sz);
    var T  = MakeTranslateMatrix(tx, ty, tz);
    var out = multiplyMatrices(Rz, S);
    out = multiplyMatrices(Ry, out);
    out = multiplyMatrices(Rx, out);
    out = multiplyMatrices(T, out);
    return out;
  }

  function MakeView(cx, cy, cz, elev, ang) {
    var T  = MakeTranslateMatrix(-cx, -cy, -cz);
    var Rx = MakeRotateXMatrix(-elev);
    var Ry = MakeRotateYMatrix(-ang);
    var tmp = multiplyMatrices(Ry, T);
    var out = multiplyMatrices(Rx, tmp);
    return out;
  }

  function MakePerspective(fovy, a, n, f) {
    var perspective = identityMatrix();
    var halfFovyRad = degToRad(fovy / 2);
    var ct = 1.0 / Math.tan(halfFovyRad);
    perspective[0] = ct / a;
    perspective[5] = ct;
    perspective[10] = (f + n) / (n - f);
    perspective[11] = 2.0 * f * n / (n - f);
    perspective[14] = -1.0;
    perspective[15] = 0.0;
    return perspective;
  }

  return {
    degToRad: degToRad,
    identityMatrix: identityMatrix,
    identityMatrix3: identityMatrix3,
    sub3x3from4x4: sub3x3from4x4,
    multiplyMatrix3Vector3: multiplyMatrix3Vector3,
    transposeMatrix3: transposeMatrix3,
    invertMatrix: invertMatrix,
    transposeMatrix: transposeMatrix,
    multiplyMatrices: multiplyMatrices,
    multiplyMatrixVector: multiplyMatrixVector,
    MakeTranslateMatrix: MakeTranslateMatrix,
    MakeRotateXMatrix: MakeRotateXMatrix,
    MakeRotateYMatrix: MakeRotateYMatrix,
    MakeRotateZMatrix: MakeRotateZMatrix,
    MakeScaleMatrix: MakeScaleMatrix,
    MakeScaleMatrixGeneric: MakeScaleMatrixGeneric,
    MakeWorld: MakeWorld,
    MakeWorldGeneric: MakeWorldGeneric,
    MakeView: MakeView,
    MakePerspective: MakePerspective
  };
})();
