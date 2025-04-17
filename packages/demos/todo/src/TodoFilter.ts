import * as R from "@synx/frp/reactive";
import { ul, li, button, a } from "@synx/dom/tags";
import { defineComponent } from "@synx/dom/component";
import { locationHash } from "@synx/dom/routing";
import { slice } from "@synx/dsl/string";
import { eq } from "@synx/dsl/logic";

function createTodoFilter() {
    const hash = slice(locationHash(), 2, undefined);
    const el = ul(
        { class: "flex gap-2 justify-between" },
        filterButton("all", hash),
        filterButton("active", hash),
        filterButton("completed", hash),
    );

    return {
        el,
        props: {},
        outputs: {},
    };
}

function filterButton(filterName: string, hash: R.Reactive<string>) {
    const isActive = eq(hash, filterName);
    return li(
        {},
        a(
            {
                class: {
                    "cursor-pointer capitalize py-1 px-2 rounded hover:border hover:border-[#ce4646]": true,
                    "border": isActive,
                    "border-[#ce4646]": isActive,
                },
                href: `#/${filterName}`
            },
            filterName,
        ),
    );
}

export const TodoFilter = defineComponent(createTodoFilter);
