open WebGl;
open DOM;

type shader = Vertex | Fragment;

let glslVertex = {|#version 300 es
precision mediump float;

in vec3 a_Position;
      
void main(void) {
  gl_Position = vec4(a_Position, 1.0);
}
|};

let glslFrag = {|#version 300 es
precision mediump float;

out vec4 fragColor;

void main(void) {
  fragColor = vec4(1.0, 0.6, 0.5, 1.0);
}
|};

let createShader = (gl : glT, sType: shader, source: string) : shaderT => {
  let t = switch (sType) {
    | Vertex => getVERTEX_SHADER(gl);
    | Fragment => getFRAGMENT_SHADER(gl);
    };

  let shader = createShader(gl, t);
  shaderSource(gl, shader, source);
  compileShader(gl, shader);
  shader;
}


let add = (~x as x1, ~y=?, ~z=0, ()) => {
  switch (x1, y) {
  | (_, Some(y')) => {
    x1 + y';
  }
  | (_, None) => x1;
  };
}

let vertices : array(float) = [|-0.5, 0.5, 0., -0.5, -0.5, 0., 0.5, -0.5, 0., 0.5, 0.5, 0.|];
let indices : array(int) = [|0, 1, 2, 0, 2, 3|];

let createBuffers = (gl: glT) : (bufferT, bufferT) => {
  let vertexBuffer = {
    let f32 = Float32Array.create(vertices);
    let buffer = createBuffer(gl);
    bindBuffer(gl, getARRAY_BUFFER(gl), buffer);
    bufferData(gl, getARRAY_BUFFER(gl), f32, getSTATIC_DRAW(gl));
    buffer;
  };

  let indexBuffer = {
    let i16 = Uint16Array.create(indices);
    let buffer = createBuffer(gl);
    bindBuffer(gl, getELEMENT_ARRAY_BUFFER(gl), buffer);
    bufferDataInt16(gl, getELEMENT_ARRAY_BUFFER(gl), i16, getSTATIC_DRAW(gl));
    buffer;
  };

  (vertexBuffer, indexBuffer);
}

let init = (gl : glT) => {
  Js.log("ready");
  createShader(gl, Fragment, "");

  clearColor(gl, 0.6, 0.9, 0.5, 1.0);
  clear(gl, getCOLOR_BUFFER_BIT(gl));

  let (vertexBuffer, indexBuffer) = createBuffers(gl);
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
