
type document;

[@bs.val] external doc : document = "document";

[@bs.send] external getElementById : (document, string) => Js.Nullable.t(Dom.element) = "getElementById";

let getElmById = (node: string) => getElementById(doc, node)