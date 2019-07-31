import { mat4, quat, quat2 } from 'gl-matrix';
import { createProgramWithShaders } from './utility/common';
import { bunnyModel } from './data/bunny';
import * as dat from 'dat.gui';

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

in vec3 v_normal;
in vec3 v_eyeVector;
out vec4 color;

void main () {
  vec3 L = normalize(u_lightDirection);
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
  let props = {
    camera: {
      rotation: {
        x: 0,
        y: 0,
        z: 0
      },
      translation: {
        x: 0,
        y: 0,
        z: 0
      }
    }
  }

  const gui = new dat.GUI();
  var cameraR = gui.addFolder('Camera Rotation');
  cameraR.add(props.camera.rotation, 'x', -10, 10).step(0.001);
  cameraR.add(props.camera.rotation, 'y', -10, 10).step(0.001);
  cameraR.add(props.camera.rotation, 'z', -10, 10).step(0.001);

  var cameraT = gui.addFolder('Camera Translation');
  cameraT.add(props.camera.translation, 'x', -30, 30).step(0.01);
  cameraT.add(props.camera.translation, 'y', -30, 30).step(0.01);
  cameraT.add(props.camera.translation, 'z', -30, 30).step(0.01);


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
        modelMatrix = mat4.create(),
        cameraMatrix = mat4.create(),
        modelViewMatrix = mat4.create(),
        normalMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);

  function draw (deltaTime) {
    gl.clearColor(0.9, 0.9, 0.9, 1);
    gl.clearDepth(100);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    let q = quat2.create();
    quat2.rotateY(q, q, cubeRotation);
    mat4.fromRotationTranslation(modelMatrix, q, [-5, -5, -20]);
    
    mat4.identity(cameraMatrix);
    let q2 = quat2.create();
    quat2.rotateX(q2, q2, props.camera.rotation.x);
    quat2.rotateY(q2, q2, props.camera.rotation.y);
    quat2.rotateZ(q2, q2, props.camera.rotation.z);
    mat4.fromRotationTranslation(cameraMatrix, q2, [props.camera.translation.x, props.camera.translation.y, props.camera.translation.z]);

    mat4.invert(modelViewMatrix, cameraMatrix);
    mat4.multiply(modelViewMatrix, modelViewMatrix, modelMatrix);

    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    gl.uniformMatrix4fv(posizione.uniforms.u_projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(posizione.uniforms.u_modelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix4fv(posizione.uniforms.u_normalMatrix, false, normalMatrix);

    gl.drawElements(gl.TRIANGLES, bunnyModel.elements.length, gl.UNSIGNED_SHORT, 0);

    q = quat2.create();
    quat2.rotateY(q, q, -cubeRotation*0.2);
    mat4.fromRotationTranslation(modelMatrix, q, [5, -5, -20]);
    
    mat4.identity(cameraMatrix);
    q2 = quat2.create();
    quat2.rotateX(q2, q2, props.camera.rotation.x);
    quat2.rotateY(q2, q2, props.camera.rotation.y);
    quat2.rotateZ(q2, q2, props.camera.rotation.z);
    mat4.fromRotationTranslation(cameraMatrix, q2, [props.camera.translation.x, props.camera.translation.y, props.camera.translation.z]);

    mat4.invert(modelViewMatrix, cameraMatrix);
    mat4.multiply(modelViewMatrix, modelViewMatrix, modelMatrix);

    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    gl.uniformMatrix4fv(posizione.uniforms.u_projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(posizione.uniforms.u_modelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix4fv(posizione.uniforms.u_normalMatrix, false, normalMatrix);

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