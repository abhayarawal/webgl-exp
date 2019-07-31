import { animationFrameScheduler, interval, of, BehaviorSubject } from 'rxjs';
import { withLatestFrom, take, distinctUntilChanged, delay, map } from 'rxjs/operators';
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


var createMesh = (model) => {
  let state = sceneGraph.snapshot(),
      { gl } = state,
      ref = (+new Date()).toString(16) + '.' + (Math.random() * 10000000 | 0).toString(16),
      { positions, elements, vertexNormals }  = model,
      mesh = { 
        [ref]: {
          render: true,
          vertexNormals,
          buffers: {
            // vertexPositionBuffer: 
          }
        }
      };

  const meshes = { ...state.entities.meshes, ...mesh }
  
  sceneGraph.setState({entities: {meshes}})
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