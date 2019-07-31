
type element;

[@bs.val] external document : element = "document";

[@bs.send] external getNodeById : (element, string) => Js.Nullable.t(Dom.element) = "getElementById";

let getElementById = (node: string) => getNodeById(document, node)