import { E, R } from "@synx/frp";
import { defineComponent, Prop } from "@synx/dom/component";
import { li, span, button } from "@synx/dom/tags";
import { Todo, toggle } from "./domain/todo";
import { prop } from "@synx/dsl/object";

function createTodo(initial: { todo: Todo }) {
    const todo = Prop(initial.todo);

    const [toggleEv, emitToggle] = E.create<MouseEvent>();

    const completed = E.fold(toggleEv, R.get(todo.prop), toggle)

    const el = li(
        {},
        span(
            {},
            prop(todo.prop, "description")
        ),
        button(
            {
                on: {
                    click: [toggleEv, emitToggle]
                }
            },
            "✖",

        )
    )

    return {
        el,
        props: {
            todo,
        },
        outputs: { completed },
    };
}

export const TodoItem = defineComponent(createTodo);
