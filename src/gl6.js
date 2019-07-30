import { vec3, mat4 } from 'gl-matrix';
import { createProgramWithShaders } from './utility/common';
import { bunnyModel } from './data/bunny';

const vShader = `#version 300 es
precision highp float;
precision highp int;

in vec4 a_position;
in vec3 a_vertexNormal;

uniform mat4 u_normalMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_modelViewMatrix;

out vec3 v_normal;
out vec3 v_eyeVector;

void main () {
  // transformed vertex position (euclidean to projective space)
  vec4 vertex = u_modelViewMatrix * a_position; 

  v_normal = vec3(u_normalMatrix * vec4(a_vertexNormal, 0.0));
  v_eyeVector = -vec3(vertex.xyz);
  gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
}
`;

const fShader = `#version 300 es
precision highp float;

uniform float u_shine;
uniform vec3 u_lightDirection;
uniform vec4 u_lightAmbient;
uniform vec4 u_lightDiffuse;
uniform vec4 u_lightSpecular;
uniform vec4 u_materialAmbient;
uniform vec4 u_materialDiffuse;
uniform vec4 u_materialSpecular;
uniform mat4 u_normalMatrix;

in vec3 v_normal;
in vec3 v_eyeVector;
out vec4 color;

void main () {
  vec3 L = normalize(u_lightDirection);
  L =  vec3(u_normalMatrix * vec4(L, 0.0));
  vec3 N = normalize(v_normal);
  float lambertTerm = dot(N, -L);
  vec4 Ia = u_lightAmbient * u_materialAmbient;
  vec4 Id = vec4(0.0, 0.0, 0.0, 1.0);
  vec4 Is = vec4(0.0, 0.0, 0.0, 1.0);
  
  if (lambertTerm > 0.0) {
    Id = u_lightDiffuse * u_materialDiffuse * lambertTerm;
    vec3 E = normalize(v_eyeVector);
    vec3 R = reflect(L, N);
    float specular = pow( max(dot(R, E), 0.), u_shine );
    Is = u_lightSpecular * u_materialSpecular * specular;
  }

  color = vec4(vec3(Ia + Id + Is), 1.0);
  // color = vec4(N, 1.);
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

  let posizione = {
    attrs: {
      a_position: gl.getAttribLocation(program, 'a_position'),
      a_normal: gl.getAttribLocation(program, 'a_vertexNormal'),
    },
    uniforms: {
      u_projectionMatrix: gl.getUniformLocation(program, 'u_projectionMatrix'),
      u_modelViewMatrix: gl.getUniformLocation(program, 'u_modelViewMatrix'),
      u_normalMatrix: gl.getUniformLocation(program, 'u_normalMatrix'),

      u_shine: gl.getUniformLocation(program, 'u_shine'),
      u_lightDirection: gl.getUniformLocation(program, 'u_lightDirection'),
      u_lightAmbient: gl.getUniformLocation(program, 'u_lightAmbient'),
      u_lightDiffuse: gl.getUniformLocation(program, 'u_lightDiffuse'),
      u_lightSpecular: gl.getUniformLocation(program, 'u_lightSpecular'),

      u_materialAmbient: gl.getUniformLocation(program, 'u_materialAmbient'),
      u_materialDiffuse: gl.getUniformLocation(program, 'u_materialDiffuse'),
      u_materialSpecular: gl.getUniformLocation(program, 'u_materialSpecular')
    }
  }

  gl.uniform1f(posizione.uniforms.u_shine, 12);
  gl.uniform3fv(posizione.uniforms.u_lightDirection, [-.25, -.25, -.25]);
  gl.uniform4fv(posizione.uniforms.u_lightAmbient, [0.02, 0.02, 0.02, 1]);
  gl.uniform4fv(posizione.uniforms.u_lightDiffuse, [1, 1, 1, 1]);
  gl.uniform4fv(posizione.uniforms.u_lightSpecular, [1, 1, 1, 1]);
  
  gl.uniform4fv(posizione.uniforms.u_materialDiffuse, [5/256, 230/256, 211/256, 1]);
  gl.uniform4fv(posizione.uniforms.u_materialAmbient, [1, 1, 1, 1]);
  gl.uniform4fv(posizione.uniforms.u_materialSpecular, [0.7, 0.7, 0.7, 1]);



  let vertexPosBuffer = gl.createBuffer();  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, bunnyModel.positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posizione.attrs.a_position);
  gl.vertexAttribPointer(posizione.attrs.a_position, 3, gl.FLOAT, false, 0, 0);

  let indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bunnyModel.elements, gl.STATIC_DRAW);


  let normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, bunnyModel.vertexNormals, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posizione.attrs.a_normal);
  gl.vertexAttribPointer(posizione.attrs.a_normal, 3, gl.FLOAT, false, 0, 0);

  var fov = 55 * Math.PI / 180, // radians
      aspect = gl.canvas.clientWidth / gl.canvas.clientHeight,
      zNear = 0.1,
      zFar = 10000.0,
      cubeRotation = 0.9;
  
  const projectionMatrix = mat4.create(),
        cameraMatrix = mat4.create(),
        modelViewMatrix = mat4.create(),
        normalMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);

  function draw (deltaTime) {
    mat4.identity(cameraMatrix);
    mat4.translate(cameraMatrix, cameraMatrix, [0.0, 0.0, +document.getElementById('t').value]);
    mat4.rotate(cameraMatrix, cameraMatrix, +document.getElementById('x').value, [1, 0, 0]);
    mat4.rotate(cameraMatrix, cameraMatrix, +document.getElementById('y').value, [0, 1, 0]);
    mat4.rotate(cameraMatrix, cameraMatrix, +document.getElementById('z').value, [0, 0, 1]);

    mat4.identity(modelViewMatrix);
    mat4.invert(modelViewMatrix, cameraMatrix);
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, -5.0, -0.0]);
    // mat4.rotate(modelViewMatrix, modelViewMatrix, 0, [0, 1, 0]);
    // mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [0, 0, 1]);

    // mat4.copy(normalMatrix, modelViewMatrix);
    // mat4.invert(normalMatrix, normalMatrix);
    mat4.transpose(normalMatrix, cameraMatrix);

    gl.uniformMatrix4fv(posizione.uniforms.u_projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(posizione.uniforms.u_modelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix4fv(posizione.uniforms.u_normalMatrix, false, normalMatrix);


    gl.clearColor(0.9, 0.9, 0.9, 1);
    gl.clearDepth(100);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, bunnyModel.elements.length, gl.UNSIGNED_SHORT, 0);

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