
type webGL2RenderingContextT = DOM.element;
type glT = webGL2RenderingContextT;

type colorBufferBitT = int;

[@bs.send] external clearColor : (glT, float, float, float, float) => unit = "clearColor";

[@bs.get] external getCOLOR_BUFFER_BIT : glT => colorBufferBitT = "COLOR_BUFFER_BIT";

[@bs.send] external clear : (glT, colorBufferBitT) => unit = "clear";