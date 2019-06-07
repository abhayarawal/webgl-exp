
type webGL2RenderingContextT = DOM.element;
type glT = webGL2RenderingContextT;

type colorBufferBitT;
type arrayBufferT;
type elementArrayBufferT = arrayBufferT;


[@bs.send] external clearColor : (glT, float, float, float, float) => unit = "clearColor";

[@bs.get] external getCOLOR_BUFFER_BIT : glT => colorBufferBitT = "COLOR_BUFFER_BIT";

[@bs.send] external clear : (glT, colorBufferBitT) => unit = "clear";

[@bs.get] external getARRAY_BUFFER : glT => arrayBufferT = "ARRAY_BUFFER";
[@bs.get] external getELEMENT_ARRAY_BUFFER : glT => elementArrayBufferT = "getELEMENT_ARRAY_BUFFER";