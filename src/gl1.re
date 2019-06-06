
type shader = Vertex | Fragment;

type context;
type document;

[@bs.val] external doc : document = "document";
[@bs.send] external getElementById : (document, string) => Js.Nullable.t(Dom.element) = "getElementById";

/* canvas.getContext(string) */
[@bs.send] external getContext : (Dom.element, string) => Js.Nullable.t(context) = "getContext";
[@bs.send] external clearColor : (context, float, float, float, float) => unit = "clearColor";


let createShader = (gl : context, sType: shader, source: string) => {
  switch (sType) {
  | Vertex => Js.log("vertex");
  | Fragment => Js.log("fragment");
  };
}






let init = (gl : context) => {
  Js.log("ready");
  createShader(gl, Fragment, "");
}


let canvasNode : string = "webgl-canvas";

let setupContext = (canvas : Dom.element) => {
  switch ( Js.Nullable.toOption(getContext(canvas, "webgl2")) ) {
  | None => Js.log("webgl2 context could not be created");
  | Some(gl) => init(gl);
  };
}

switch ( Js.Nullable.toOption(getElementById(doc, canvasNode)) ) {
| None => Js.log(canvasNode ++ " element not found");
| Some(el) => setupContext(el);
};
