import { animationFrameScheduler, interval, of } from 'rxjs';
import { withLatestFrom, take } from 'rxjs/operators';

var sceneGraph = {
  entities: {
    meshes: {
    }
  }
};

let state$ = of(sceneGraph);
interval(0, animationFrameScheduler)
.pipe(
  withLatestFrom(state$),
  take(10)
)
.subscribe(([_, { entities }]) => {

  let { meshes } = entities;
  console.log(meshes)

});

// mesh - buffer[attrs]; 