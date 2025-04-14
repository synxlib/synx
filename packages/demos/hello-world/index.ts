import { on, bind, binds, inputValue, show, bindClass, bindClasses } from '@synx/dom';
import { concat, length } from '@synx/dsl/string';
import { pipe, $ } from '@synx/dsl/pipe';
import { not } from '@synx/dsl/logic';
import * as E from '@synx/frp/event';
import * as R from '@synx/frp/reactive';
import { gt } from '@synx/dsl/logic';

const input = document.getElementById('name') as HTMLElement;
const result = document.getElementById('result') as HTMLElement;

const valueEntered = pipe(on(input, 'input'))
  .to(E.debounce, $, 50)
  .to(inputValue, $)
  .to(E.stepper, $, "")
  .value();

const resultValue = concat('Hello ', valueEntered);

binds(result, {
    // show: inputValue,
    "classes": {
        "text-green-700": gt(length(valueEntered), 3),
        block: R.map(valueEntered, (v) => !!v),
        hidden: not(valueEntered),
    },
    text: resultValue,
});

// bindClasses(result, {
//     "text-green-700": map(inputValue, v => v.length > 3)
// });
// bind(result, "text", resultValue);
// show(result, inputValue);

// Future
// Input.ts
// const initialValue = E.create<string>();

// const inputEv = E.create<string>();
// const value = stepper(E.concat([initialValue, inputEv]), "");

// const el = div({ on: { input: inputEv } },
//   input({ ref: 'input' }),
//   div({ ref: 'result' }, bind.text(value))
// );

// export const HelloWorld = { el, props: { initialValue }, outputs: { value } };


// Parent.ts
// import Input from './Input.ts';

// const el = div({},
//   h1({}, "Enter your name:"),
//   child(Input, { initialValue: "World" }),
//   div({ ref: 'greeting' }, bind.text(
//     Input.outputs.value.map(name => `Hello, ${name}!`)
//   ))
// );

// export const Parent = { el, props: {}, outputs: {} };

// root.ts
// import Parent from './Parent.ts';

// document.body.appendChild(Parent.el);