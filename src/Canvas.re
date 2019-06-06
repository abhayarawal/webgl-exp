type context;

[@bs.send] external getContext : (Dom.element, string) => Js.Nullable.t(context) = "getContext";