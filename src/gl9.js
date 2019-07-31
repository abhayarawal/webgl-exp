import { animationFrameScheduler, interval, of, BehaviorSubject } from 'rxjs';
import { withLatestFrom, take, distinctUntilChanged, delay, map } from 'rxjs/operators';
import { mat4, quat2 } from 'gl-matrix';
import { createProgramWithShaders } from './utility/common';
import { StoreFactory } from './Store';

import { bunnyModel } from './data/bunny';
import { cube } from './data/cube';


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


const canvas = document.getElementById('webgl-canvas'),
      gl = canvas.getContext('webgl2');

var sceneGraphInitial = {
  gl,
  entities: {
    meshes: {
    }
  },
  materials: {

  },
  camera: {}
};

var sceneGraph = StoreFactory(sceneGraphInitial);

var newRef = () => {
  return (+new Date()).toString(16) + '.' + (Math.random() * 10000000 | 0).toString(16);
}

var matFromQuat = (translation = [0, 0, 0], rotation = [0, 0, 0]) => {
  let matrix = mat4.create(),
      q = quat2.create(),
      [x, y, z] = rotation;

  quat2.rotateX(q, q, x);
  quat2.rotateY(q, q, y);
  quat2.rotateZ(q, q, z);
  mat4.fromRotationTranslation(matrix, q, translation);
  return matrix;
}


var createMesh = (model, translation, rotation) => {
  let state = sceneGraph.snapshot(),
      gl = state.get('gl'),
      ref = newRef(),
      { positions, elements, vertexNormals } = model;
      
  let vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  let idxBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elements, gl.STATIC_DRAW);

  let vertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexNormals, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  let modelMatrix = matFromQuat(translation, rotation);

  let mesh = {
    render: true,
    idxLength: elements.length,
    buffers: {
      vertexPositionBuffer,
      idxBuffer,
      vertexNormalBuffer
    },
    modelMatrix,
    modelViewMatrix: mat4.create(),
    normalMatrix: mat4.create(),
    position: {
      translation,
      rotation
    }
  };

  sceneGraph.setStateIn(['entities', 'meshes', ref], mesh);
  return ref;
}



var createShaderMaterial = (vertexSource, fragSource) => {
  let state = sceneGraph.snapshot(),
      gl = state.get('gl'),
      ref = newRef(),
      program = createProgramWithShaders(gl, vertexSource, fragSource);
  
  let attrs = {
    a_position: gl.getAttribLocation(program, 'a_position'),
    a_normal: gl.getAttribLocation(program, 'a_vertexNormal'),
  };

  let uniforms = {
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

  sceneGraph.setStateIn(['materials', ref], {
    program, attrs, uniforms
  });

  return ref;
}


var attachMaterialToMesh = (meshRef, matRef) => {
  let state = sceneGraph.snapshot(),
      mesh = state.getIn(['entities', 'meshes', meshRef]);

  if (mesh) {
    mesh = { ...mesh, matRef };
    sceneGraph.setStateIn(['entities', 'meshes', meshRef], mesh);
  } else {
    throw `mesh ${ meshRef } does not exist`;
  }
}


var createCamera = (translation, rotation) => {
  var gl = sceneGraph.snapshot().get('gl'),
      fov = 55 * Math.PI / 180,
      aspect = gl.canvas.clientWidth / gl.canvas.clientHeight,
      zNear = 0.1,
      zFar = 10000.0;
  
  let projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);

  let cameraMatrix = matFromQuat(translation, rotation);

  let camera = {
    projectionMatrix,
    cameraMatrix,
    position: {
      translation,
      rotation
    }
  }

  sceneGraph.setStateIn(['camera'], camera);
}



var updateMeshes = () => {

}

var drawMesh = ( mesh ) => {
  let state = sceneGraph.snapshot(),
      gl = state.get('gl'),
      camera = state.get('camera'),
      { program, attrs, uniforms } = sceneGraph.snapshot().getIn(['materials', mesh.matRef]);
  
  gl.useProgram(program);
  let vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffers.vertexPositionBuffer);
  gl.enableVertexAttribArray(attrs.a_position);
  gl.vertexAttribPointer(attrs.a_position, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.buffers.idxBuffer);

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffers.vertexNormalBuffer);
  gl.enableVertexAttribArray(attrs.a_normal);
  gl.vertexAttribPointer(attrs.a_normal, 3, gl.FLOAT, false, 0, 0);

  let { modelMatrix, modelViewMatrix, normalMatrix, idxLength } = mesh;
  let { cameraMatrix, projectionMatrix } = camera;

  mat4.invert(modelViewMatrix, cameraMatrix);
  mat4.multiply(modelViewMatrix, modelViewMatrix, modelMatrix);

  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);

  gl.uniform1f(uniforms.u_shine, 12);
  gl.uniform3fv(uniforms.u_lightDirection, [-.25, -.25, -.25]);
  gl.uniform4fv(uniforms.u_lightAmbient, [0.02, 0.02, 0.02, 1]);
  gl.uniform4fv(uniforms.u_lightDiffuse, [1, 1, 1, 1]);
  gl.uniform4fv(uniforms.u_lightSpecular, [1, 1, 1, 1]);
  
  gl.uniform4fv(uniforms.u_materialDiffuse, [5/256, 100/256, 211/256, 1]);
  gl.uniform4fv(uniforms.u_materialAmbient, [1, 1, 1, 1]);
  gl.uniform4fv(uniforms.u_materialSpecular, [0.7, 0.7, 0.7, 1]);

  gl.uniformMatrix4fv(uniforms.u_projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(uniforms.u_modelViewMatrix, false, modelViewMatrix);
  gl.uniformMatrix4fv(uniforms.u_normalMatrix, false, normalMatrix);

  gl.drawElements(gl.TRIANGLES, idxLength, gl.UNSIGNED_SHORT, 0);
    

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.deleteVertexArray(vao);
}


let gl$ = sceneGraph.select('gl');
let entities$ = sceneGraph.select('entities');


interval(0, animationFrameScheduler)
.pipe(
  withLatestFrom(gl$, entities$),
  // take(5)
)
.subscribe(([_, gl, entities]) => {
  gl.clearColor(0.9, 0.9, 0.9, 1);
  gl.clearDepth(100);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  entities.get('meshes').map(mesh => {
    drawMesh(mesh);
  })
});




let mesh = createMesh(bunnyModel, [2, -5, -20], [0, 0, 0]),
    mesh2 = createMesh(cube, [-5, 0, -9], [0.5, 0, 0]),
    mesh3 = createMesh(bunnyModel, [-3, -5, -25], [0, 0, 0]),
    mesh4 = createMesh(bunnyModel, [7, -0, -19], [.7, 0, 0]),
    mesh5 = createMesh(bunnyModel, [-9, 3, -30], [0, 0, 0]),
    material = createShaderMaterial(vShader, fShader);
    
createCamera([0, 0, 0], [0, 0, 0]);
attachMaterialToMesh(mesh, material);
attachMaterialToMesh(mesh2, material);
attachMaterialToMesh(mesh3, material);
attachMaterialToMesh(mesh4, material);
attachMaterialToMesh(mesh5, material);