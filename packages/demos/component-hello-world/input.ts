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
