import { E, R } from "@synx/frp";
import { defineComponent } from "@synx/dom/component";
import { Prop } from "@synx/dom/component";
import { div, h1, input, footer } from "@synx/dom/tags";
import { subscribe, get } from "@synx/frp/reactive";
import { createTodo, Todo } from "./domain/todo";
import { TodoList } from "./TodoList";
import { inputValue } from "@synx/dom";
import { ifElse, gt, lt } from "@synx/dsl/logic";
import { filter, length} from "@synx/dsl/list";
import { sub } from "@synx/dsl/math";

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
    const [submitTodo, emitSubmit] = E.create<KeyboardEvent>();
    const initialTodos = loadTodos();

    const todos = E.fold(
        inputValue(E.filter(submitTodo, (e) => e.key === "Enter")),
        initialTodos,
        (todos, value) => ([...todos, createTodo(value)])
    )

    const remaining = sub(
        length(todos),
        length(filter(todos, (todo) => todo.completed))
    );

    R.subscribe(todos, saveTodos);

    const el = div(
        { class: "todo-app" },
        h1({ class: "text-2xl font-bold mb-4" }, "Todo List"),
        input({
            type: "text",
            placeholder: "Add a new todo",
            class: "mb-4",
            on: {
                keypress: [submitTodo, emitSubmit]
            }
        }),
        TodoList({ todos }).el,
        footer({ class: {
            "mt-2": true,
            hidden: lt(remaining, 1)
        } }, remaining, " ", ifElse(gt(remaining, 1), R.of("items"), R.of("item")), " left"),
    );

    return {
        el,
        props: {},
        outputs: {}
    };
}

export const TodoApp = defineComponent(createTodoApp);
