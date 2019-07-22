let isVowel = (char) =>
  switch char {
    | 'a' | 'e' | 'i' | 'o' | 'u' => true
    | _ => false 
  };
  

type person = { age: int, name: string };

let me : person = { age: 26, name: "Avay" };

let meNextYear = { ...me, age: me.age + 1 };

Js.log(meNextYear);

Js.log(me.age + 2);

type account = 
  | None
  | Twitter(string, int)
  | Instagram(string);

let jane = Twitter("jane", 29);

switch jane {
  | Twitter(name, _) => "Hiya " ++ name
  | _ => "Hiya!"
};

Js.log(jane);