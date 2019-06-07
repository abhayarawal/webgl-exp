
type webGL2RenderingContextT = DOM.element;
type glT = webGL2RenderingContextT;

type colorBufferBitT;
type arrayBufferT;
type elementArrayBufferT = arrayBufferT;

type drawT;
type bufferT;



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

