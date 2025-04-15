import * as E from "@synx/frp/event";
import * as R from "@synx/frp/reactive";
import {
    defineComponent,
    Ref,
    refOutputs,
} from "@synx/dom/component";
import {
    div,
    h1,
} from "@synx/dom/tags";
import { Input } from "./input";

function createPage() {
    // Reference to get access to the input component instance
    const inputRef = Ref<ReturnType<typeof Input>>();

    // Create the page structure
    const el = div(
        { class: "bg-white p-8 rounded-lg shadow-md w-full max-w-sm" },
        h1({ class: "text-xl font-semibold mb-4 text-gray-800" }, "Enter your name:"),
        Input({
            initialValue: "World",
            ref: inputRef,
        }).el,
        div({}, "Hello, ", refOutputs(inputRef, "value")),
    );

    return {
        el,
        props: {},
        outputs: {},
    };
}

// Define the Page component
export const Page = defineComponent(createPage);
