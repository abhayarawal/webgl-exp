
type shader = Vertex | Fragment;

type canvas;
type context;
type document;


[@bs.val] external doc : document = "document";
[@bs.send] [@bs.return null_to_opt] external getElementById : (document, string) => option(Dom.element) = "getElementById";

/* canvas.getContext(string) */
[@bs.send] external getContext : (canvas, string) => context = "getContext";

let canvasNode : string = "webgl-canvass";
let elCanvas = getElementById(doc, canvasNode);


switch (elCanvas) {
| None => Js.log(canvasNode ++ " element not found");
| Some(_) => Js.log(elCanvas);
};


let createShader = (gl, sType: shader, source: string) => {
  switch (sType) {
  | Vertex => {}
  | Fragment => {}
  };
}