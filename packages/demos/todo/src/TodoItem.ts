import { E, R } from "@synx/frp";
import { defineComponent, Prop } from "@synx/dom/component";
import { li, span, button, input } from "@synx/dom/tags";
import { Todo, toggle } from "./domain/todo";
import { prop } from "@synx/dsl/object";

function createTodo(initial: { todo: Todo }) {
    const todo = Prop(initial.todo);

    const [toggleEv, emitToggle] = E.create<Event>();
    const [deleteEv, emitDelete] = E.create<MouseEvent>();

    const completed = E.map(
        E.map(toggleEv, () => R.get(todo.prop)),
        (todo) => todo.id
    );

    const deleted = E.map(
        E.map(deleteEv, () => R.get(todo.prop)),
        (todo) => todo.id
    );

    const el = li(
        { class: "flex justify-between gap-2 items-center p-2" },
        input({ type: "checkbox", checked: prop(todo.prop, "completed"), on: {
            input: emitToggle
        }}),
        span(
            {
                class: {
                    "align-left": true,
                    "line-through": prop(todo.prop, "completed"),
                }
            },
            prop(todo.prop, "description")
        ),
        button(
            {
                class: "cursor-pointer",
                type: "button",
                on: {
                    click: emitDelete
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
        outputs: { completed, deleted },
    };
}

export const TodoItem = defineComponent(createTodo);
