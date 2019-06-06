
type document;

[@bs.val] external doc : document = "document";

[@bs.send] external getNodeById : (document, string) => Js.Nullable.t(Dom.element) = "getElementById";

let getElementById = (node: string) => getNodeById(doc, node)