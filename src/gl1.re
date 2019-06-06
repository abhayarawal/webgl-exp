
type shader = Vertex | Fragment;

type context;
type document;

[@bs.val] external doc : document = "document";
[@bs.send] [@bs.return null_to_opt] external getElementById : (document, string) => option(Dom.element) = "getElementById";

/* canvas.getContext(string) */
[@bs.send] [@bs.return null_to_opt] external getContext : (Dom.element, string) => option(context) = "getContext";


let createShader = (gl, sType: shader, source: string) => {
  switch (sType) {
  | Vertex => {}
  | Fragment => {}
  };
}

let init = (gl : context) => {
  Js.log("ready");
}


let canvasNode : string = "webgl-canvas";

let setupContext = (canvas : Dom.element) => {
  switch ( getContext(canvas, "webgl2") ) {
  | None => Js.log("webgl2 context could not be created");
  | Some(gl) => init(gl);
  };
}

switch ( getElementById(doc, canvasNode) ) {
| None => Js.log(canvasNode ++ " element not found");
| Some(el) => setupContext(el);
};
