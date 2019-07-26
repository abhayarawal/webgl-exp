import { vec3, mat4 } from 'gl-matrix';
import { createProgramWithShaders } from './utility/common';

const vShader = `#version 300 es
precision highp float;
precision highp int;

in vec4 a_position;
in vec3 a_vertexNormal;

uniform mat4 u_normalMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_modelViewMatrix;
uniform vec3 u_lightDirection;
uniform vec4 u_lightDiffuse;
uniform vec4 u_lightAmbient;
uniform vec4 u_materialDiffuse;

out vec4 v_color;

void main () {
  vec3 N = vec3(u_normalMatrix * vec4(a_vertexNormal, 1.0));
  vec3 L = normalize(u_lightDirection);
  float lambertTerm = dot(N, -L);

  vec4 Ia = u_lightAmbient;
  vec4 Id = u_materialDiffuse * u_lightDiffuse * lambertTerm;

  v_color = vec4(vec3(Ia + Id), 1.0);
  gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
}
`;

const fShader = `#version 300 es
precision highp float;

in vec4 v_color;
out vec4 color;

void main () {
  color = v_color;
  // color = vec4(0.3, 0.5, 0.8, 1.);
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

    // Right face
    1.0, -1.0, -1.0,
    1.0,  1.0, -1.0,
    1.0,  1.0,  1.0,
    1.0, -1.0,  1.0,
    
    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
  ];

  const indices = [
    0, 1, 2,      0, 2, 3,
    4, 5, 6,      4, 6, 7,
    8, 9, 10,     8, 10, 11,
    12, 13, 14,   12, 14, 15,
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
  ];

  let posizione = {
    attrs: {
      a_position: gl.getAttribLocation(program, 'a_position'),
      a_normal: gl.getAttribLocation(program, 'a_vertexNormal'),
    },
    uniforms: {
      u_projectionMatrix: gl.getUniformLocation(program, 'u_projectionMatrix'),
      u_modelViewMatrix: gl.getUniformLocation(program, 'u_modelViewMatrix'),
      u_normalMatrix: gl.getUniformLocation(program, 'u_normalMatrix'),
      u_lightDirection: gl.getUniformLocation(program, 'u_lightDirection'),
      u_lightAmbient: gl.getUniformLocation(program, 'u_lightAmbient'),
      u_lightDiffuse: gl.getUniformLocation(program, 'u_lightDiffuse'),
      u_materialDiffuse: gl.getUniformLocation(program, 'u_materialDiffuse'),
    }
  }

  gl.uniform3fv(posizione.uniforms.u_lightDirection, [0, 0, -1]);
  gl.uniform4fv(posizione.uniforms.u_lightAmbient, [0.01, 0.01, 0.01, 1]);
  gl.uniform4fv(posizione.uniforms.u_lightDiffuse, [1.7, 1.7, 1.7, 1]);
  gl.uniform4f(posizione.uniforms.u_materialDiffuse, 0.3, 0.5, 0.8, 1);

  let vertexPosBuffer = gl.createBuffer();  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posizione.attrs.a_position);
  gl.vertexAttribPointer(posizione.attrs.a_position, 3, gl.FLOAT, false, 0, 0);

  let indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

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

     // Right
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,

    // Left
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0
  ];

  let normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posizione.attrs.a_normal);
  gl.vertexAttribPointer(posizione.attrs.a_normal, 3, gl.FLOAT, false, 0, 0);

  var fov = 45 * Math.PI / 180, // radians
        aspect = gl.canvas.clientWidth / gl.canvas.clientHeight,
        zNear = 0.1,
        zFar = 10000.0,
        cubeRotation = 0.5;

  function draw (deltaTime) {
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);

    const modelViewMatrix = mat4.create();
    mat4.identity(modelViewMatrix);
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -7.0]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [1, 0, 0]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [0, 1, 0]);

    const normalMatrix = mat4.create();
    mat4.copy(normalMatrix, modelViewMatrix);
    mat4.invert(normalMatrix, normalMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    gl.uniformMatrix4fv(posizione.uniforms.u_projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(posizione.uniforms.u_modelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix4fv(posizione.uniforms.u_normalMatrix, false, normalMatrix);


    gl.clearColor(0.9, 0.9, 0.9, 1);
    gl.clearDepth(100);
    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    cubeRotation += deltaTime;
  }

  var then = 0;
  function render (now) {
    now *= 0.001;
    const deltaTime = now - then;
    then = now;
    draw(deltaTime);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  function destroy () {
    // Clean up
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // Delete WebGL resources
    gl.deleteBuffer(vertexPosBuffer);
    gl.deleteBuffer(indexBuffer);
    gl.deleteProgram(program);
    gl.deleteVertexArray(vao);
  }

})()