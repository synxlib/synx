import { E, R } from "@synx/frp";
import { div, input } from "@synx/dom/tags";
import { defineComponent, Prop } from "@synx/dom/component";
import { inputValue } from "@synx/dom";
import { orElse } from "@synx/dsl/logic";

function createInput() {
    const initialValue = Prop("");
    const inputEv = E.create<globalThis.Event>();

    const value = orElse(
        E.stepper(inputValue(inputEv[0]), ""),
        initialValue.prop,
    );
    const el = div(
        {},
        input({
            on: { input: inputEv },
            class: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4",
        }),
    );
    return { el, props: { initialValue }, outputs: { value } };
}

export const Input = defineComponent(createInput);

