import { E, R } from "@synx/frp";
import { defineComponent, Ref, refOutput } from "@synx/dom/component";
import { div, h1, input, footer, span, button } from "@synx/dom/tags";
import { createTodo, Todo } from "./domain/todo";
import { TodoList } from "./TodoList";
import { TodoFilter } from "./TodoFilter";
import { inputValue } from "@synx/dom";
import { locationHash } from "@synx/dom/routing";
import { ifElse, gt, lt, eq } from "@synx/dsl/logic";
import { filter, length } from "@synx/dsl/list";
import { sub } from "@synx/dsl/math";
import { slice } from "@synx/dsl/string";
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

    const todoCompleted = refOutput(todoList, "completed");
    const todoDeleted = refOutput(todoList, "deleted");
    const filterValue = slice(locationHash(), 2, undefined);

    const todos = combineReducers(initialTodos, [
        on(
            inputValue(E.filter(submitTodo, (e) => e.key === "Enter")),
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

        on(clear, (ev, todos) => todos.filter((t) => !t.completed))
    ]);

    const totalCount = length(todos);
    const completedCount = length(filter(todos, (todo) => todo.completed));

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

    const el = div(
        { class: "todo-app" },
        h1({ class: "text-2xl font-bold mb-4" }, "Todo List"),
        input({
            type: "text",
            placeholder: "Add a new todo",
            class: "mb-4",
            on: {
                keypress: emitSubmit,
            },
        }),
        TodoList({ todos: filteredTodos, ref: todoList }).el,
        footer(
            {
                class: {
                    "flex items-center gap-2": true,
                    hidden: lt(remaining, 1),
                },
            },
            span({},
                remaining,
                " ",
                ifElse(gt(remaining, 1), "items", "item"),
                " left",
            ),
            TodoFilter({}).el,
            button({
                on: { click: emitClear },
                class: {
                    hidden: R.map(completedCount, (c) => c === 0)
                }
            }, "Clear Completed")
        ),
    );

    return {
        el,
        props: {},
        outputs: {},
    };
}

export const TodoApp = defineComponent(createTodoApp);
