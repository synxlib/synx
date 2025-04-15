import { R } from "@synx/frp";
import { defineComponent, Prop, children } from "@synx/dom/component";
import { Todo } from "./domain/todo";
import { ul } from "@synx/dom/tags";
import { TodoItem } from "./TodoItem";

function createTodos(initial: { todos: Todo[] }) {
    const todos = Prop(initial.todos);

    R.subscribe(todos.prop, (t) => {
        console.log("Todos changed", t);
    });

    const el = ul(
        {},
        children(todos.prop, (todo) => TodoItem({ todo }).el)
    );

    return {
        el,
        props: {
            todos,
        },
        outputs: {}
    };
}

export const TodoList = defineComponent(createTodos);
