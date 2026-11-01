export function serializeTodo(todo) {
    return {
        id: String(todo._id),
        title: todo.title,
        status: todo.status,
        createdAt: todo.createdAt,
        completedAt: todo.completedAt,
    };
}
