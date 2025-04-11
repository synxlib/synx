import { on, bind, binds, targetValue, show, bindClass, bindClasses } from '@synx/dom';
import { concat, pipe, $ } from '@synx/dsl';
import { sub } from '@synx/dsl/src/math';
import { debounce, stepper } from '@synx/frp/event';
import { subscribe, map } from '@synx/frp/reactive';

const input = document.getElementById('name') as HTMLElement;
const result = document.getElementById('result') as HTMLElement;

const inputValue = pipe(on(input, 'input'))
  .next(debounce, $, 50)
  .next(targetValue, $)
  .next(stepper, $, "")
  .value();

// const inputValue = stepper(targetValue(debounce(on(input, 'input'), 50)), "")

const resultValue = concat('Hello ', inputValue);

subscribe(map(inputValue, v => v.length > 3), (v) => {
    console.log('inputValue', v);
});

binds(result, {
    show: inputValue,
    "classes": {
        "text-green-700": map(inputValue, v => v.length > 3)
        // block: map(inputValue, (v) => !!v),
        // hidden: map(inputValue, v => !v),
    },
    text: resultValue,
});
// bindClasses(result, {
//     "text-green-700": inputValue
// });
// bind(result, "text", resultValue);
// show(result, inputValue);
