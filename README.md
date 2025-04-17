# Synx

> A minimal, reactive UI library for the DOM — no virtual DOM, no compiler, no magic.

Synx is a tiny yet expressive reactive library that brings **clarity, predictability, and purity** to UI development.

It is built on a composable FRP core, but you can choose your own abstraction level:
- Use just the **core primitives** (`Event`, `Reactive`, `subscribe`, etc.)
- Add **DOM helpers** (`div`, `input`, `bind.text`, `on.click`, etc.)
- Or build UIs with the **full component model** (`defineComponent`, `props`, `outputs`, `children()`)

Synx follows a consistent dataflow:

**→ Events → Fold → State → DOM → Events → ...**

---

## 🧠 Core Principles

- **Static DOM Tree**  
  All DOM structure is defined **once**, up front. Reactivity only applies to:
  - Attributes (`value`, `checked`, `class`, etc.)
  - Events (`on.click`, `on.input`, etc.)
  - Text content
  - Children (`children()`)

  Dynamic child nodes (`children()`) are also defined as *reactive bindings to content*, but the **container** node remains fixed.

- **Real DOM, Not Virtual**  
  Synx operates directly on the DOM. No diffing, patching, or reconciliation engines.  
  It uses efficient, minimal updates based on fine-grained reactivity.

- **Composable, Algebraic Reactivity**
  `Event<A>` and `Reactive<A>` form functors, applicatives, and monads.  
  You can build complex behaviors by combining tiny, testable expressions.

- **Reactive Children with Minimal DOM Mutation**
  Synx provides a `children()` helper that updates child nodes with:
  - Optional `key()` diffing
  - `create` and `update` functions
  - Efficient DOM reuse instead of full re-renders

- **Unidirectional Dataflow**
  Every component expresses:
  - Inputs as **reactive events** (`props`)
  - Outputs as **event streams**
  - DOM as a **function of state**, never the source of truth

---

## 🚀 Example

You can start using Synx without any DOM helpers or components.

```ts
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
    "classes": {
        "text-green-700": gt(length(valueEntered), 3),
        block: R.map(valueEntered, (v) => !!v),
        hidden: not(valueEntered),
    },
    text: resultValue,
});
```
Or you can start using components.

```ts
import { E, R } from "@synx/frp";
import { div, input } from "@synx/dom/tags";
import { defineComponent, Prop } from "@synx/dom/component";
import { inputValue } from "@synx/dom";

function createInput(initial: { initialValue: string }) {
    const initialValue = Prop(initial.initialValue);
    const [inputEv, emitInput] = E.create<Event>();

    const rawValue = inputValue(inputEv);
    
    const el = div(
        {},
        input({
            on: { input: emitInput },
            class: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4",
        }),
    );
    return { el, props: { initialValue }, outputs: { value: rawValue } };
}

export const Input = defineComponent(createInput);
```

Checkout the full [TodoMVC implementation](packages/demos/todo).

---

## 🔧 Use Synx at Your Level

Synx is layered by design. Use as much or as little as you need:

| Layer | What it gives you | Opt-in? |
|-------|-------------------|---------|
| `@synx/frp` | Core FRP primitives (`Event`, `Reactive`, `subscribe`, `fold`, etc.) | ✅ |
| `@synx/dom` | DOM helpers: `bind`, `on`, `text`, `children`, etc. | ✅ |
| `@synx/dom/component` | Component system: `defineComponent`, `child`, `refOutputs`, `props`, `outputs` | Optional |
| `@synx/dsl` | Use helper functions such as `concat`, `add`, etc. to act directly on `Reactive` values without `map`, `ap` etc. | Optional |

---

## 🌀 The Cycle: Events → Fold → DOM → Events

Synx models UI as a pure dataflow cycle:

```
User Interaction
       ↓
    Event<A>
       ↓
Fold / stepper / reducer
       ↓
Reactive<A>
       ↓
DOM Update (text, attr, class)
       ↓
New Events triggered
       ↓
(repeat)
```

This makes everything **traceable and debuggable**. No side effects hidden in render trees or lifecycle hooks.

---

© 2025-present Debjit Biwas. MIT License.
