open WebGl;
open DOM;

type shader = Vertex | Fragment;


let createShader = (gl : glT, sType: shader, source: string) => {
  switch (sType) {
  | Vertex => Js.log("vertex");
  | Fragment => Js.log("fragment");
  };
}






let init = (gl : glT) => {
  Js.log("ready");
  createShader(gl, Fragment, "");

  clearColor(gl, 0.6, 0.9, 0.5, 1.0);
  clear(gl, getCOLOR_BUFFER_BIT(gl));
}


let canvasNode : string = "webgl-canvas";

let setupContext = (canvas : Dom.element) => {
  switch ( Canvas.getContext(canvas, "webgl2") |> Js.Nullable.toOption ) {
  | None => Js.log("webgl2 context could not be created");
  | Some(gl) => init(gl);
  };
}

switch ( canvasNode |> getElementById |> Js.Nullable.toOption ) {
| None => Js.log(canvasNode ++ " element not found");
| Some(el) => setupContext(el);
};
