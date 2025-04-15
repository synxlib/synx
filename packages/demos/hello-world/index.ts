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
