import { animationFrameScheduler, interval, of, BehaviorSubject } from 'rxjs';
import { withLatestFrom, take, distinctUntilChanged, delay, map } from 'rxjs/operators';
import { mat4, quat2 } from 'gl-matrix';
import { createProgramWithShaders } from './utility/common';
import { StoreFactory } from './Store';

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
  let modelMat4 = mat4.create(),
      q = quat2.create(),
      [x, y, z] = rotation;

  quat2.rotateX(q, q, x);
  quat2.rotateY(q, q, x);
  quat2.rotateZ(q, q, x);
  return mat4.fromRotationTranslation(modelMat4, q, translation);
}


var createMesh = (model, translation, rotation) => {
  let state = sceneGraph.snapshot(),
      gl = state.get('gl'),
      ref = newRef(),
      { positions, elements, vertexNormals }  = model;
      
  let vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  let idxBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elements, gl.STATIC_DRAW);

  let vertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexNormals, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  let modelMat4 = matFromQuat(translation, rotation);

  let mesh = {
    render: true,
    buffers: {
      vertexPositionBuffer,
      idxBuffer,
      vertexNormalBuffer
    },
    modelMat4,
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

}


let entities$ = sceneGraph.select('entities')

interval(500, animationFrameScheduler)
.pipe(
  withLatestFrom(entities$),
  take(5)
)
.subscribe(([_, entities]) => {

  entities.get('meshes').map(mesh => {
    console.log(mesh);
  })

});




let mesh = createMesh(bunnyModel),
    material = createShaderMaterial(vShader, fShader),
    camera = createCamera([0, 0, 0], [0, 0, 0]);
    
attachMaterialToMesh(mesh, material);
