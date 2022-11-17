var res = 30;
var radius = 0.2;

var sphereVertices = [];
var sphereNormals = [];

for(i = 0; i <= res; i++) {
    for(j = 0; j <= res; j++) {

        theta = 2 * Math.PI * i / res;
        phi = Math.PI * j / res;
        x = radius * Math.sin(phi) * Math.cos(theta);
        y = radius * Math.sin(phi) * Math.sin(theta);
        z = radius * Math.cos(phi);
        n = [Math.sin(phi) * Math.cos(theta),
            Math.sin(phi) * Math.sin(theta),
            Math.cos(phi)];
        sphereVertices.push([x, y, z]);
        sphereNormals.push([n[0], n[1], n[2]]);
    }
}

var sphereIndices = [];

for(i = 0; i < res; i++) {
    for(j = 0; j < res; j++) {
        sphereIndices[6*(i*res+j)  ] = (res+1)*j+i;
        sphereIndices[6*(i*res+j)+1] = (res+1)*j+i+1;
        sphereIndices[6*(i*res+j)+2] = (res+1)*(j+1)+i+1;
        sphereIndices[6*(i*res+j)+3] = (res+1)*j+i;
        sphereIndices[6*(i*res+j)+4] = (res+1)*(j+1)+i+1;
        sphereIndices[6*(i*res+j)+5] = (res+1)*(j+1)+i;
    }
}