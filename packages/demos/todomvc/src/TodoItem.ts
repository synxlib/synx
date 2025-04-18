import { E, R } from "@synx/frp";
import { defineComponent, Prop, Ref } from "@synx/dom/component";
import { li, span, button, input, div, label } from "@synx/dom/tags";
import { Todo, toggle } from "./domain/todo";
import { inputValue, classes } from "@synx/dom";
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
    const cancelSubmit = E.filter(submitTodo, (e) => e.key === 'Escape');
    const rawValue = E.stepper(inputValue(onSubmit), "");
    const submitValue = E.map(E.filter(E.tag(onSubmit, trim(rawValue)), (s) => s.length > 0), (s) => ({ id: R.get(todo.prop).id, description: s }));

    const isEditing = E.fold(E.concatAll([
        editEv as E.Event<Event>,
        onSubmit as E.Event<Event>,
        cancelSubmit as E.Event<Event>
    ]), false, (acc, ev) => !acc);

    const inputRef = Ref<HTMLInputElement>();

    R.subscribe(isEditing, (startedEditing) => {
        if (startedEditing) {
            setTimeout(() => {
                R.get(inputRef.ref)?.focus();
            })
        }
    })

    const el = div(
        { class: { todo: true, completed: isCompleted } },
        div({
            class: classes(
                "view flex justify-between gap-2 items-center pl-4 group",
                [not(isEditing), "p-4"]
            )},
            input({
                class: "toggle w-[30] h-[30] rounded-[30] appearance-none border border-gray-400 checked:before:content-['✓'] before:text-xl before:pl-[5px] before:text-green-600",
                type: "checkbox",
                checked: prop(todo.prop, "completed"),
                on: { input: emitToggle }
            }),
            label(
                {
                    class: classes(
                        "grow text-2xl transition-colors delay-150 duration-300 ease-in-out",
                        [isCompleted, "line-through text-gray-500"],
                        [isEditing, "hidden"]
                    ),
                    on: { dblclick: emitEdit }
                },
                prop(todo.prop, "description")
            ),
            input({
                type: "text",
                placeholder: "What needs to be done?",
                autofocus: true,
                class: {
                    "new-todo text-xl w-full bg-white h-[65] p-2 shadow-md placeholder:text-2xl placeholder:text-gray-400 placeholder:italic focus:border-2 focus:border-[#cf7d7d] outline-none": true,
                    "hidden": not(isEditing),
                },
                value: prop(todo.prop, "description"),
                on: {
                    keyup: emitSubmit,
                },
                ref: inputRef
            }),
            button(
                {
                    class: classes(
                        "destroy cursor-pointer text-red-600 hidden",
                        [not(isEditing), "group-hover:block"]
                    ),
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
