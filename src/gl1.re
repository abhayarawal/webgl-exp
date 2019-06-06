
type shader = Vertex | Fragment;


/* canvas.getContext(string) */
/* [@bs.send] external clearColor : (context, float, float, float, float) => unit = "clearColor"; */


let createShader = (gl : Canvas.context, sType: shader, source: string) => {
  switch (sType) {
  | Vertex => Js.log("vertex");
  | Fragment => Js.log("fragment");
  };
}






let init = (gl : Canvas.context) => {
  Js.log("ready");
  createShader(gl, Fragment, "");
}


let canvasNode : string = "webgl-canvas";

let setupContext = (canvas : Dom.element) => {
  switch ( Js.Nullable.toOption(Canvas.getContext(canvas, "webgl2")) ) {
  | None => Js.log("webgl2 context could not be created");
  | Some(gl) => init(gl);
  };
}

switch ( DOM.getElmById(canvasNode) -> Js.Nullable.toOption ) {
| None => Js.log(canvasNode ++ " element not found");
| Some(el) => setupContext(el);
};
