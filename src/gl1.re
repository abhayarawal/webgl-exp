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


let createShader = (gl : glT, sType: shader, source: string) : option(shaderT) => {
  let t = switch (sType) {
    | Vertex => getVERTEX_SHADER(gl);
    | Fragment => getFRAGMENT_SHADER(gl);
  };

  let shader = createShader(gl, t);
  shaderSource(gl, shader, source);
  compileShader(gl, shader);

  switch (getShaderParameter(gl, shader, getCOMPILE_STATUS(gl))) {
    | true => Some(shader);
    | false => {
      let message = getShaderInfoLog(gl, shader);
      Js.log({j|Shader Compile Error: $message|j});
      deleteShader(gl, shader);
      None;
    }
  };
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


let createGlProgram = (gl: glT, shaders: (shaderT, shaderT)) : option(programT) => {
  let program = createProgram(gl);
  let (vS, fS) = shaders;
  
  attachShader(gl, program, vS);
  attachShader(gl, program, fS);
  linkProgram(gl, program);

  switch (getProgramParameter(gl, program, getLINK_STATUS(gl))) {
    | true => Some(program);
    | false => {
      let message = getProgramInfoLog(gl, program);
      Js.log({j|"Could not create program: $message"|j});
      deleteProgram(gl, program);
      None;
    }
  };
}


let raiseEx = (message : string) => {
  Js.Exn.raiseError("CUSTOM: " ++ message)
}

let init = (gl : glT) => {
  
  clearColor(gl, 0., 0., 0., 1.);
  

  let (vertexBuffer, indexBuffer) = createBuffers(gl);

  switch (createShader(gl, Vertex, glslVertex), createShader(gl, Fragment, glslFrag)) {
    | (None, None) => raiseEx("Could not compile shaders");
    | (None, Some(_)) => raiseEx("Could not compile vertex shader");
    | (Some(_), None) => raiseEx("Could not compile fragment shader");
    | (Some(vertexShader), Some(fragShader)) => {

      switch (createGlProgram(gl, (vertexShader, fragShader))) {
        | None => ()
        | Some(program) => {

          // VAO Vertex Array Object [attributes]
          let vertexArray = createVertexArray(gl);
          bindVertexArray(gl, vertexArray);

          useProgram(gl, program);

          let aPosition = getAttribLocation(gl, program, "a_Position");

          bindBuffer(gl, getARRAY_BUFFER(gl), vertexBuffer);

          // setup the attributes in the vertex array
          enableVertexAttribArray(gl, aPosition);
          vertexAttribPointer(gl, aPosition, 3, getFLOAT(gl), false, 0, 0);
  
          clear(gl, getCOLOR_BUFFER_BIT(gl) lor getDEPTH_BUFFER_BIT(gl));
          viewport(gl, 0, 0, canvasWidth(gl), canvasHeight(gl));

          bindBuffer(gl, getELEMENT_ARRAY_BUFFER(gl), indexBuffer);
          drawElements(gl, getTRIANGLES(gl), Array.length(indices), getUNSIGNED_SHORT(gl), 0);
        }
      };
      
    }
  };  

  Js.log("exit");
}


let canvasNode : string = "webgl-canvas";

let setupContext = (canvas : Dom.element) => {
  switch ( Canvas.getContext(canvas, "webgl2") -> Js.Nullable.toOption ) {
    | None => Js.log("webgl2 context could not be created");
    | Some(gl) => init(gl);
  };
}

switch ( canvasNode -> getElementById -> Js.Nullable.toOption ) {
  | None => Js.log(canvasNode ++ " element not found");
  | Some(el) => setupContext(el);
};
