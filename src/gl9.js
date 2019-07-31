import { animationFrameScheduler, interval, of, BehaviorSubject } from 'rxjs';
import { withLatestFrom, take, distinctUntilChanged, delay, map } from 'rxjs/operators';
import { mat4, quat2 } from 'gl-matrix';
import { createProgramWithShaders } from './utility/common';
import { StoreFactory } from './Store';

import { bunnyModel } from './data/bunny';



const canvas = document.getElementById('webgl-canvas'),
      gl = canvas.getContext('webgl2');

var sceneGraphInitial = {
  gl,
  entities: {
    meshes: {
    }
  }
};

var sceneGraph = StoreFactory(sceneGraphInitial);


var createMesh = (model, translation = [0, 0, 0], rotation = [0, 0, 0]) => {
  let state = sceneGraph.snapshot(),
      { gl } = state,
      ref = (+new Date()).toString(16) + '.' + (Math.random() * 10000000 | 0).toString(16),
      { positions, elements, vertexNormals }  = model;
      
  let vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  let idxBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elements, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  let modelMat4 = mat4.create(),
      q = quat2.create(),
      [x, y, z] = rotation;
  
  quat2.rotateX(q, q, x);
  quat2.rotateY(q, q, x);
  quat2.rotateZ(q, q, x);
  mat4.fromRotationTranslation(modelMat4, q, translation);

  let mesh = { 
    [ref]: {
      render: true,
      vertexNormals,
      buffers: {
        vertexPositionBuffer,
        idxBuffer
      },
      modelMat4
    }
  };

  const meshes = { ...state.entities.meshes, ...mesh }
  
  sceneGraph.setState({entities: {meshes}})
}





// createMesh(bunnyModel)

var updateMeshes = () => {

}

let entities$ = sceneGraph.select('entities')

interval(500, animationFrameScheduler)
.pipe(
  withLatestFrom(entities$),
  take(15)
)
.subscribe(([_, entities]) => {

  let { meshes } = entities;
  console.log(meshes)

});

// mesh - buffer[attrs]; 