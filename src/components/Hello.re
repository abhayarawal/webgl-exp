let component = ReasonReact.statelessComponent("Hello");

let make = (~name) =>
  <h2>{ReasonReact.string("Hello" ++ name)} </h2>;