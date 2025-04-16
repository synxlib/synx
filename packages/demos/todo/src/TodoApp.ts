import { E, R } from "@synx/frp";
import { defineComponent, Ref, refOutput } from "@synx/dom/component";
import { div, h1, input, footer } from "@synx/dom/tags";
import { createTodo, Todo } from "./domain/todo";
import { TodoList } from "./TodoList";
import { inputValue } from "@synx/dom";
import { ifElse, gt, lt } from "@synx/dsl/logic";
import { filter, length } from "@synx/dsl/list";
import { sub } from "@synx/dsl/math";
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

    const todoCompleted = refOutput(todoList, "completed");
    const todoDeleted = refOutput(todoList, "deleted");

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
    ]);

    const remaining = sub(
        length(todos),
        length(filter(todos, (todo) => todo.completed)),
    );

    R.subscribe(todos, saveTodos);

    const incompleteTodos = filter(todos, (todo) => !todo.completed);

    const el = div(
        { class: "todo-app" },
        h1({ class: "text-2xl font-bold mb-4" }, "Todo List"),
        input({
            type: "text",
            placeholder: "Add a new todo",
            class: "mb-4",
            on: {
                keypress: [submitTodo, emitSubmit],
            },
        }),
        TodoList({ todos: todos, ref: todoList }).el,
        footer(
            {
                class: {
                    "mt-2": true,
                    hidden: lt(remaining, 1),
                },
            },
            remaining,
            " ",
            ifElse(gt(remaining, 1), "items", "item"),
            " left",
        ),
    );

    return {
        el,
        props: {},
        outputs: {},
    };
}

export const TodoApp = defineComponent(createTodoApp);
