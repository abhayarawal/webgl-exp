
type webGL2RenderingContextT = DOM.element;
type glT = webGL2RenderingContextT;

type colorBufferBitT;
type arrayBufferT;
type elementArrayBufferT = arrayBufferT;

type drawT;
type bufferT;
type shaderTypeT;
type shaderT;

type compileStatusT;


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