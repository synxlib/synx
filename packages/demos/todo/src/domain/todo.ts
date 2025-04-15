export interface Todo {
    id: string;
    description: string;
    completed: boolean;
}

export function createTodo(description: string): Todo {
    return {
        id: Math.random().toString(32),
        description,
        completed: false,
    };
}

export function toggle(todo: Todo) {
    return {
        ...todo,
        completed: !todo.completed,
    };
}
