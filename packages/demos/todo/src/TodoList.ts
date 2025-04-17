import { E, R } from "@synx/frp";
import {
    defineComponent,
    Prop,
    Ref,
    children,
    refOutput,
} from "@synx/dom/component";
import { Todo } from "./domain/todo";
import { ul } from "@synx/dom/tags";
import { TodoItem } from "./TodoItem";

function createTodos(initial: { todos: Todo[] }) {
    const todos = Prop(initial.todos);

    const items = R.mapEachReactive(
        todos.prop,
        (todo) => TodoItem({ todo: todo }),
        {
            key: (todo) => todo.id,
        },
    );

    const el = ul(
        {},
        children(items, {
            create: (item) => [item.el, item.cleanup],
        }),
    );

    const completed = R.concatE(
        R.map(items, (items) => items.map((item) => item.outputs.completed)),
    );

    const deleted = R.concatE(
        R.map(items, (items) => items.map((item) => item.outputs.deleted)),
    );

    return {
        el,
        props: {
            todos,
        },
        outputs: { completed: completed, deleted: deleted },
    };
}

export const TodoList = defineComponent(createTodos);

