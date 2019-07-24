import { vec3, mat4 } from 'gl-matrix';
import { createProgramWithShaders } from './utility/common';

const vShader = `#version 300 es
precision highp float;
precision highp int;

in vec4 a_position;
in vec3 a_normal;

uniform mat4 u_projectionMatrix;
uniform mat4 u_modelViewMatrix;

out vec3 v_normal;

void main () {
  v_normal = a_normal;
  gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
}
`;

const fShader = `#version 300 es
precision highp float;

in vec3 v_normal; 

uniform vec3 u_reverseLightDir;
uniform vec4 u_color;

out vec4 color;

void main () {
  vec3 normal = normalize(v_normal);
  float light = dot(normal, u_reverseLightDir);
  color = u_color;
  color *= light;
}
`;



(function () {

  const canvas = document.getElementById('webgl-canvas'),
        gl = canvas.getContext('webgl2');
  
  // init program
  let program = createProgramWithShaders(gl, vShader, fShader);
  gl.useProgram(program);


  // init vertex array
  let vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  
  const position = [
    // ff
    -1.0, -1.0, 1.0,
    1.0, -1.0, 1.0,
    1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0,

    // back f
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
    1.0,  1.0, -1.0,
    1.0, -1.0, -1.0,

    // tf
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
    1.0,  1.0,  1.0,
    1.0,  1.0, -1.0,

    // bottom f
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,
  ];

  const indices = [
    0, 1, 2,      0, 2, 3,
    4, 5, 6,      4, 6, 7,
    8, 9, 10,     8, 10, 11,
    12, 13, 14,   12, 14, 15
  ];

  let posizione = {
    attrs: {
      a_position: gl.getAttribLocation(program, 'a_position'),
      a_normal: gl.getAttribLocation(program, 'a_normal'),
    },
    uniforms: {
      u_projectionMatrix: gl.getUniformLocation(program, 'u_projectionMatrix'),
      u_modelViewMatrix: gl.getUniformLocation(program, 'u_modelViewMatrix'),
      u_color: gl.getUniformLocation(program, 'u_color'),
      u_reverseLightDir: gl.getUniformLocation(program, 'u_reverseLightDir'),
    }
  }

  let vertexPosBuffer = gl.createBuffer();  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posizione.attrs.a_position);
  gl.vertexAttribPointer(posizione.attrs.a_position, 3, gl.FLOAT, false, 0, 0);

  let indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  gl.uniform4fv(posizione.uniforms.u_color, [0.5, 0.4, 0.9, 1.0]);
  gl.uniform3fv(posizione.uniforms.u_reverseLightDir, vec3.normalize(vec3.create(), [0.5, 0.3, 0.9]));

  const vertexNormals = [
    // Front
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,

    // Back
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,

    // Top
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,

    // Bottom
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
  ];

  let normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posizione.attrs.a_normal);
  gl.vertexAttribPointer(posizione.attrs.a_normal, 3, gl.FLOAT, false, 0, 0);

  const fov = 45 * Math.PI / 180, // radians
        aspect = gl.canvas.clientWidth / gl.canvas.clientHeight,
        zNear = 0.1,
        zFar = 100.0,
        projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);

  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -10.0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, 0.5, [1, 0, 0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, 0.9, [0, 1, 0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, 0, [0, 1, 0]);

  gl.uniformMatrix4fv(posizione.uniforms.u_projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(posizione.uniforms.u_modelViewMatrix, false, modelViewMatrix);




  gl.clearColor(0.9, 0.9, 0.9, 1);
  gl.clearDepth(100);
  gl.enable(gl.DEPTH_TEST);
  // gl.enable(gl.CULL_FACE);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);



  // Clean up
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  // Delete WebGL resources
  gl.deleteBuffer(vertexPosBuffer);
  gl.deleteBuffer(indexBuffer);
  gl.deleteProgram(program);
  gl.deleteVertexArray(vao);
})()