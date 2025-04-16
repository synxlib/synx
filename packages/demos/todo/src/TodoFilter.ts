import * as E from "@synx/frp/event";
import { ul, li, button, a } from "@synx/dom/tags";
import { defineComponent } from "@synx/dom/component";

function createTodoFilter() {
    const el = ul(
        { class: "flex gap-2 justify-center" },
        filterButton("all"),
        filterButton("active"),
        filterButton("completed"),
    );

    return {
        el,
        props: {},
        outputs: {},
    };
}

function filterButton(filterName: string) {
    return li(
        {},
        a(
            {
                class: "cursor-pointer capitalize",
                href: `#/${filterName}`
            },
            filterName,
        ),
    );
}

export const TodoFilter = defineComponent(createTodoFilter);
