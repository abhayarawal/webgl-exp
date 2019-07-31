import { BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';


function StoreFactory ( initialValue ) {
  let store$ = new BehaviorSubject(initialValue);

  let store = () => {
    return store$
  }

  let snapshot = () => {
    return store$.getValue()
  }

  let setState = (partial) => {
    let state = store$.getValue(),
        nextState = Object.assign({}, state, partial);

    store$.next(nextState);
  }

  let select = (k) => {
    return store$.pipe(
      map((state) => {
        return state[k]
      }),
      distinctUntilChanged()
    )
  }

  return Object.freeze({
    store,
    snapshot,
    setState,
    select
  })
}

export { StoreFactory }