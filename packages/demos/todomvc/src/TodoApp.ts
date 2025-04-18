import { E, R } from "@synx/frp";
import { defineComponent, Ref, refOutput } from "@synx/dom/component";
import { section, div, h1, input, footer, span, button, header } from "@synx/dom/tags";
import { createTodo, Todo } from "./domain/todo";
import { TodoList } from "./TodoList";
import { TodoFilter } from "./TodoFilter";
import { inputValue } from "@synx/dom";
import { locationHash } from "@synx/dom/routing";
import { ifElse, gt, lt, eq, and } from "@synx/dsl/logic";
import { filter, length } from "@synx/dsl/list";
import { sub } from "@synx/dsl/math";
import { slice, trim } from "@synx/dsl/string";
import { combineReducers, on } from "@synx/dsl/reducer";

const STORAGE_KEY = "todos";

function loadTodos(): Todo[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveTodos(todos: Todo[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function createTodoApp() {
    const initialTodos = loadTodos();
    const [submitTodo, emitSubmit] = E.create<KeyboardEvent>();
    const todoList = Ref<ReturnType<typeof TodoList>>();
    const [clear, emitClear] = E.create<MouseEvent>();
    const [completeAllEv, emitCompleteAll] = E.create<Event>();

    const todoCompleted = refOutput<string>(todoList, "completed");
    const todoDeleted = refOutput<string>(todoList, "deleted");
    const todoEdited = refOutput<{ id: string, description: string }>(todoList, "edited");
    const filterValue = slice(locationHash(), 2, undefined);

    E.subscribe(todoEdited, (v) => console.log("TodoApp: todoEdited", v))

    const onSubmit = E.filter(submitTodo, (e) => e.key === "Enter");
    const rawValue = E.stepper(inputValue(onSubmit), "");
    const submitValue = E.filter(E.tag(onSubmit, trim(rawValue)), (s) => s.length > 0);
    const inputElValue = R.map(rawValue, () => "");

    // This is just fold underneath
    const todos = combineReducers(initialTodos, [
        on(
            submitValue,
            (description, todos) => [...todos, createTodo(description)],
        ),

        on(todoCompleted, (id, todos) =>
            todos.map(
                (
                    t,
                ) => (t.id === id ? { ...t, completed: !t.completed } : t),
            ),
        ),

        on(todoDeleted, (id, todos) =>
            todos.filter((t) => t.id !== id),
        ),

        on(clear, (ev, todos) => todos.filter((t) => !t.completed)),

        on(todoEdited, ({ id, description }, todos) => 
            todos.map(
                (t) => (t.id === id ? { ...t, description } : t),
        )),

        on(
            E.map(completeAllEv, (ev: globalThis.Event) => {
                const input = ev.target as HTMLInputElement | null;
                return input?.checked ?? false;
            }),
            (value, todos) => 
                todos.map((t) => ({...t, completed: value })
            )
        )
    ]);

    const totalCount = length(todos);
    const completedCount = length(filter(todos, (todo) => todo.completed));
    const areAllComplete = and(gt(totalCount, 0), eq(totalCount, completedCount));

    const remaining = sub(
        totalCount,
        completedCount
    );

    R.subscribe(todos, saveTodos);

    const filteredTodos = R.ap(todos, R.map(
        filterValue,
        (filter) => (todos: Todo[]) => todos.filter(
            filter === "all" ? (() => true) :
            filter === "active" ? ((todo) => !todo.completed) :
            filter === "completed" ? ((todo) => todo.completed) :
            () => true,
        )
    ));

    const el = section(
        { class: "todoapp w-full" },
        header({ class: "header mt-4 relative" },
            h1({ class: "title text-7xl text-[#b83f45] text-center" }, "todos"),
            input({
                type: "checkbox",
                class: "absolute bottom-[16px] left-[15px] w-[30] h-[30] rounded-[30] appearance-none border border-gray-400 checked:before:content-['✓'] before:text-xl before:pl-[5px] before:text-green-600",
                checked: areAllComplete,
                on: { input: emitCompleteAll }
            }),
            input({
                type: "text",
                placeholder: "What needs to be done?",
                class: "new-todo text-xl w-full mt-4 bg-white h-[65] p-2 pl-16 shadow-md placeholder:text-2xl placeholder:text-gray-400 placeholder:italic focus:border-2 focus:border-[#cf7d7d] outline-none",
                value: inputElValue,
                on: {
                    keypress: emitSubmit,
                },
            }),
        ),
        section({ class: "main bg-white border-1 border-[#e6e6e6]" },
            TodoList({ todos: filteredTodos, ref: todoList }).el,
        ),
        footer(
            {
                class: {
                    "footer relative flex items-center justify-between gap-2 p-3 bg-white": true,
                    hidden: lt(totalCount, 1),
                },
            },
            span({},
                remaining,
                " ",
                ifElse(eq(remaining, 1), "item", "items"),
                " left",
            ),
            TodoFilter({}).el,
            div({
                class: { "min-w-32": true}
            },
                button({
                    on: { click: emitClear },
                    class: {
                        "float-right cursor-pointer hover:underline": true,
                        hidden: eq(completedCount, 0),
                    }
                }, "Clear Completed")
            )
        ),
    );

    return {
        el,
        props: {},
        outputs: {},
    };
}

export const TodoApp = defineComponent(createTodoApp);
