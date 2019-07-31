import { mat4 } from 'gl-matrix';
import { createProgramWithShaders } from './utility/common';

const vShader = `#version 300 es
precision highp float;
precision highp int;

in vec4 a_position;
uniform mat4 u_projectionMatrix;
uniform mat4 u_modelViewMatrix;

void main () {
  gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
}
`;

const fShader = `#version 300 es
precision highp float;

out vec4 color;

void main () {
  color = vec4(1., .2, .6, 1.);
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
    -1.0, -1.0, // 1.0,
    1.0, -1.0, // 1.0,
    1.0, 1.0, // 1.0,
    -1.0, 1.0, // 1.0
  ];

  const indices = [
    // ff
    0, 1, 2,      0, 2, 3
  ];

  let posizione = {
    attrs: {
      a_position: gl.getAttribLocation(program, 'a_position'),
    },
    uniforms: {
      u_projectionMatrix: gl.getUniformLocation(program, 'u_projectionMatrix'),
      u_modelViewMatrix: gl.getUniformLocation(program, 'u_modelViewMatrix'),
    }
  }


  let vertexPosBuffer = gl.createBuffer();  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posizione.attrs.a_position);
  gl.vertexAttribPointer(posizione.attrs.a_position, 2, gl.FLOAT, false, 0, 0);

  let indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);


  gl.clearColor(0.9, 0.9, 0.9, 1);
  gl.clearDepth(100);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  const fov = 45 * Math.PI / 180, // radians
        aspect = gl.canvas.clientWidth / gl.canvas.clientHeight,
        zNear = 0.1,
        zFar = 100.0,
        projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);

  const modelViewMatrix = mat4.create();

  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -7.0]);

  gl.uniformMatrix4fv(posizione.uniforms.u_projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(posizione.uniforms.u_modelViewMatrix, false, modelViewMatrix);

  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  // -- Delete WebGL resources
  gl.deleteBuffer(vertexPosBuffer);
  gl.deleteBuffer(indexBuffer);
  gl.deleteProgram(program);
  gl.deleteVertexArray(vao);
})()