import { E, R } from "@synx/frp";
import {
    defineComponent,
    Prop,
    each,
    RefMap,
    mergeRefOutputs,
} from "@synx/dom/component";
import { Todo } from "./domain/todo";
import { ul, li } from "@synx/dom/tags";
import { TodoItem } from "./TodoItem";

function createTodos(initial: { todos: Todo[] }) {
    const todos = Prop(initial.todos);

    const items = RefMap<string, ReturnType<typeof TodoItem>>();

    const completed = mergeRefOutputs(items, "completed");
    const deleted = mergeRefOutputs(items, "deleted");
    const edited = mergeRefOutputs(items, "edited");

    const el = ul(
        {},
        each(todos.prop, {
            create: (todo, k) => li({}, TodoItem({ todo, ref: items.get(String(k)) })),
            key: (todo) => todo.id,
        }),
    );

    return {
        el,
        props: { todos },
        outputs: { completed: completed, deleted: deleted, edited },
    };
}

export const TodoList = defineComponent(createTodos);

