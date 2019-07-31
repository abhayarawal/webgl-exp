import { BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { fromJS } from 'immutable';

function StoreFactory ( initialValue ) {
  let store$ = new BehaviorSubject(fromJS(initialValue));

  let store = () => {
    return store$
  }

  let snapshot = () => {
    return store$.getValue()
  }

  let setState = (partial) => {
    let nextState = store$.getValue().merge(partial);
    store$.next(nextState);
  }

  let setStateIn = (route, value) => {
    let nextState = store$.getValue().setIn(route, value);
    store$.next(nextState);
  }

  let select = (k) => {
    return store$.pipe(
      map((state) => {
        return state.get(k)
      }),
      distinctUntilChanged()
    )
  }

  return Object.freeze({
    store,
    snapshot,
    setStateIn,
    setState,
    select
  })
}

export { StoreFactory }