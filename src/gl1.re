open WebGl;
open DOM;

type shader = Vertex | Fragment;

let glslVertex = {|#version 300 es
precision mediump float;

in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;

out vec4 v_color;
      
void main(void) {
  vec2 position = a_position + u_translation;
  vec2 z1 = position / u_resolution;
  vec2 z2 = z1 * 2.0;
  vec2 clipSpace = z2 - 1.;
  gl_Position = vec4(clipSpace * vec2(1., -1.), 0., 1.0);
  v_color = gl_Position * 0.5 + 0.5;
}
|};

let glslFrag = {|#version 300 es
precision mediump float;

in vec4 v_color;
out vec4 fragColor;

void main(void) {
  fragColor = v_color;
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


let vertices : array(float) = [|100., 200., 100., 400., 500., 400., 300., 200.|];
let indicesTre : array(int) = [|0, 1, 2, 0, 2, 3|];
let indices : array(int) = [|0, 1, 1, 2, 0, 2, 0, 3, 3, 2|];


let createBuffers = (gl: glT) : (bufferT, bufferT) => {
  let vertexBuffer = {
    let f32 = Float32Array.create(vertices);
    let buffer = createBuffer(gl);
    bindBuffer(gl, getARRAY_BUFFER(gl), buffer);
    bufferData(gl, getARRAY_BUFFER(gl), f32, getSTATIC_DRAW(gl));
    bindBuffer(gl, getARRAY_BUFFER(gl), Js.Nullable.null);
    buffer;
  };

  let indexBuffer = {
    let i16 = Uint16Array.create(indicesTre);
    let buffer = createBuffer(gl);
    bindBuffer(gl, getELEMENT_ARRAY_BUFFER(gl), buffer);
    bufferDataInt16(gl, getELEMENT_ARRAY_BUFFER(gl), i16, getSTATIC_DRAW(gl));
    bindBuffer(gl, getELEMENT_ARRAY_BUFFER(gl), Js.Nullable.null);
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

          

          let aPosition = getAttribLocation(gl, program, "a_position");
          let uResolution = getUniformLocation(gl, program, "u_resolution");
          let uTranslation = getUniformLocation(gl, program, "u_translation");
          let translation : ref((float, float)) = ref((0., 0.));

          translation := (2., 6.);

          let draw = () => {

            bindBuffer(gl, getARRAY_BUFFER(gl), vertexBuffer);
            bindVertexArray(gl, vertexArray);

            useProgram(gl, program);         


            // setup the attributes in the vertex array
            enableVertexAttribArray(gl, aPosition);

            // refer to the currently bound VBO
            vertexAttribPointer(gl, aPosition, 2, getFLOAT(gl), false, 0, 0);
    
            uniform2f(gl, uResolution, canvasWidth(gl), canvasHeight(gl));

            let (x, y) = translation^;
            uniform2f(gl, uTranslation, x, y);

            clear(gl, getCOLOR_BUFFER_BIT(gl) lor getDEPTH_BUFFER_BIT(gl));
            viewport(gl, 0, 0, canvasWidth(gl), canvasHeight(gl));

            bindBuffer(gl, getELEMENT_ARRAY_BUFFER(gl), indexBuffer);
            drawElements(gl, getTRIANGLES(gl), Array.length(indicesTre), getUNSIGNED_SHORT(gl), 0);

          }

          draw();


          // bindVertexArray(gl, Js.Nullable.null);
          // bindBuffer(gl, getARRAY_BUFFER(gl), Js.Nullable.null);
          // bindBuffer(gl, getELEMENT_ARRAY_BUFFER(gl), Js.Nullable.null);
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


module HelloComponent = {
  [@react.component]
  let make = (~name) =>
    <h2> {ReasonReact.string("Hello " ++ name)} </h2>;
}

ReactDOMRe.renderToElementWithId(<HelloComponent name="Abhaya" />, "root");