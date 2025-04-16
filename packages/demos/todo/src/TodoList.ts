import { E, R } from "@synx/frp";
import { defineComponent, Prop, Ref, children, refOutput } from "@synx/dom/component";
import { Todo } from "./domain/todo";
import { ul } from "@synx/dom/tags";
import { TodoItem } from "./TodoItem";

function createTodos(initial: { todos: Todo[] }) {
    const todos = Prop(initial.todos);

    const todosWithOutputs = R.map(todos.prop, (list) =>
        list.map((todo, i) => {
          const inst = TodoItem({ todo });
          return { el: inst.el, completed: inst.outputs.completed, deleted: inst.outputs.deleted };
        })
    );
      
    const el = ul({}, children(todosWithOutputs, (item) => item.el));
      
    const completedEvents = R.map(todosWithOutputs, (items) =>
        items.map((item) => item.completed)
    );
      
    const anyCompleted = R.concatE(completedEvents);

    const deleteEvents = R.concatE(R.map(todosWithOutputs, (items) =>
        items.map((item) => item.deleted)
    ));

    E.subscribe(deleteEvents, (completed) => {
        console.log("deleteEvent", completed);
    });

    return {
        el,
        props: {
            todos,
        },
        outputs: { completed: anyCompleted, deleted: deleteEvents },
    };
}

export const TodoList = defineComponent(createTodos);
