import { E, R } from "@synx/frp";
import { defineComponent, Prop } from "@synx/dom/component";
import { li, span, button, input, div, label } from "@synx/dom/tags";
import { Todo, toggle } from "./domain/todo";
import { inputValue } from "@synx/dom";
import { prop } from "@synx/dsl/object";
import { not } from "@synx/dsl/logic";
import { slice, trim } from "@synx/dsl/string";

function createTodo(initial: { todo: Todo }) {
    const todo = Prop(initial.todo);

    R.subscribe(todo.prop, (v) => console.log("TodoItem: Todo updated", v))

    const [toggleEv, emitToggle] = E.create<Event>();
    const [deleteEv, emitDelete] = E.create<MouseEvent>();
    const [editEv, emitEdit] = E.create<MouseEvent>();
    const [submitTodo, emitSubmit] = E.create<KeyboardEvent>();

    const completed = E.map(
        E.map(toggleEv, () => R.get(todo.prop)),
        (todo) => todo.id
    );

    const deleted = E.map(
        E.map(deleteEv, () => R.get(todo.prop)),
        (todo) => todo.id
    );

    const isCompleted = prop(todo.prop, "completed");

    const onSubmit = E.filter(submitTodo, (e) => e.key === "Enter");
    const rawValue = E.stepper(inputValue(onSubmit), "");
    const submitValue = E.map(E.filter(E.tag(onSubmit, trim(rawValue)), (s) => s.length > 0), (s) => ({ id: R.get(todo.prop).id, description: s }));
    const inputElValue = R.map(rawValue, () => "");

    const isEditing = E.fold(E.concat(editEv as E.Event<Event>, onSubmit as E.Event<Event>), false, (acc, ev) => {
        return !acc;
    });

    const el = div(
        { class: { todo: true, completed: isCompleted } },
        div({ class: "view flex justify-between gap-2 items-center p-4 group" },
            input({
                class: "toggle w-[30] h-[30] rounded-[30] appearance-none border border-gray-400 checked:before:content-['✓'] before:text-xl before:pl-[5px] before:text-green-600",
                type: "checkbox",
                checked: prop(todo.prop, "completed"),
                on: { input: emitToggle }
            }),
            label(
                {
                    class: {
                        "grow text-2xl transition-colors delay-150 duration-300 ease-in-out": true,
                        "line-through": isCompleted,
                        "text-gray-500": isCompleted,
                        "hidden": isEditing
                    },
                    on: { dblclick: emitEdit }
                },
                prop(todo.prop, "description")
            ),
            input({
                type: "text",
                placeholder: "What needs to be done?",
                class: {
                    "new-todo text-xl w-full mt-4 bg-white h-[65] p-2 pl-16 shadow-md placeholder:text-2xl placeholder:text-gray-400 placeholder:italic focus:border-2 focus:border-[#cf7d7d] outline-none": true,
                    "hidden": not(isEditing),
                },
                value: prop(todo.prop, "description"),
                on: {
                    keypress: emitSubmit,
                },
            }),
            button(
                {
                    class: "destroy cursor-pointer group-hover:block hidden text-red-600",
                    type: "button",
                    on: { click: emitDelete }
                },
                "✖",

            )
        ),
    )

    return {
        el,
        props: {
            todo,
        },
        outputs: { completed, deleted, edited: submitValue },
    };
}

export const TodoItem = defineComponent(createTodo);
