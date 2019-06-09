
type webGL2RenderingContextT = DOM.element;
type glT = webGL2RenderingContextT;

type programT;

type colorBufferBitT;
type arrayBufferT;
type elementArrayBufferT = arrayBufferT;

type drawT;
type bufferT;
type shaderTypeT;
type shaderT;

type compileStatusT;

type linkStatusT;

type vertexArrayT;

type attribLocationT = int;


[@bs.send] external clearColor : (glT, float, float, float, float) => unit = "clearColor";

[@bs.get] external getCOLOR_BUFFER_BIT : glT => colorBufferBitT = "COLOR_BUFFER_BIT";

[@bs.send] external clear : (glT, colorBufferBitT) => unit = "clear";

[@bs.get] external getARRAY_BUFFER : glT => arrayBufferT = "ARRAY_BUFFER";

[@bs.get] external getELEMENT_ARRAY_BUFFER : glT => elementArrayBufferT = "ELEMENT_ARRAY_BUFFER";

[@bs.get] external getSTATIC_DRAW : glT => drawT = "STATIC_DRAW";

[@bs.send] external createBuffer : glT => bufferT = "createBuffer";

[@bs.send] external bindBuffer : (glT, arrayBufferT, bufferT) => unit = "bindBuffer";

[@bs.send] external bufferData : (glT, arrayBufferT, Float32Array.t, drawT) => unit = "bufferData";

[@bs.send] external bufferDataInt16 : (glT, elementArrayBufferT, Uint16Array.t, drawT) => unit = "bufferData";

[@bs.get] external getVERTEX_SHADER : glT => shaderTypeT = "VERTEX_SHADER";

[@bs.get] external getFRAGMENT_SHADER : glT => shaderTypeT = "FRAGMENT_SHADER";

[@bs.send] external createShader : (glT, shaderTypeT) => shaderT = "createShader";

[@bs.send] external deleteShader: (glT, shaderT) => unit = "deleteShader";

[@bs.send] external shaderSource : (glT, shaderT, string) => unit = "shaderSource";

[@bs.send] external compileShader : (glT, shaderT) => unit = "compileShader";

[@bs.get] external getCOMPILE_STATUS : glT => compileStatusT = "COMPILE_STATUS";

[@bs.send] external getShaderParameter: (glT, shaderT, compileStatusT) => bool = "getShaderParameter";

[@bs.send] external getShaderInfoLog : (glT, shaderT) => string = "getShaderInfoLog";

[@bs.send] external createProgram : glT => programT = "createProgram";

[@bs.send] external attachShader : (glT, programT, shaderT) => unit = "attachShader";

[@bs.send] external linkProgram : (glT, programT) => unit = "linkProgram";

[@bs.send] external useProgram : (glT, programT) => unit = "useProgram";

[@bs.send] external deleteProgram : (glT, programT) => unit = "deleteProgram";

[@bs.get] external getLINK_STATUS : glT => linkStatusT = "LINK_STATUS";

[@bs.send] external getProgramParameter : (glT, programT, linkStatusT) => bool = "getProgramParameter";

[@bs.send] external getProgramInfoLog : (glT, programT) => string = "getProgramInfoLog";

[@bs.send] external createVertexArray : glT => vertexArrayT = "createVertexArray";

[@bs.send] external bindVertexArray : (glT, vertexArrayT) => unit = "bindVertexArray";

[@bs.send] external getAttribLocation : (glT, programT, string) => attribLocationT = "getAttribLocation";