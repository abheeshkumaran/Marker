'use client';

import { useEffect, useState } from 'react';

function formatDateTime(value) {
    return new Date(value).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function TodoTable({ title, todos, emptyText, busyId, onStatus, onDelete }) {
    const completed = title === 'Completed';
    return (
        <section className="rounded-lg bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                {title}
                <span
                    className={
                        'rounded-full px-2 py-0.5 text-xs font-medium ' +
                        (completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')
                    }
                >
                    {todos.length}
                </span>
            </h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 text-gray-500">
                            <th className="px-4 py-3 font-medium">Created date</th>
                            <th className="px-4 py-3 font-medium">My Todo</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 text-right font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {todos.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-6 text-gray-500">
                                    {emptyText}
                                </td>
                            </tr>
                        ) : (
                            todos.map((todo) => (
                                <tr key={todo.id} className="border-b border-gray-100 last:border-0">
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                        {formatDateTime(todo.createdAt)}
                                    </td>
                                    <td
                                        className={
                                            'px-4 py-3 ' +
                                            (completed ? 'text-gray-500 line-through' : 'text-gray-900')
                                        }
                                    >
                                        {todo.title}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <span
                                            className={
                                                'rounded-full px-2.5 py-1 text-xs font-semibold ' +
                                                (completed
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700')
                                            }
                                        >
                                            {completed ? 'Completed' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right">
                                        <div className="inline-flex gap-2">
                                            {completed ? (
                                                <button
                                                    type="button"
                                                    disabled={busyId === todo.id}
                                                    onClick={() => onStatus(todo, 'pending')}
                                                    className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                                                >
                                                    Pending
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    disabled={busyId === todo.id}
                                                    onClick={() => onStatus(todo, 'completed')}
                                                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                                >
                                                    Completed
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                disabled={busyId === todo.id}
                                                onClick={() => onDelete(todo)}
                                                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default function TodoPage() {
    const [todos, setTodos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [title, setTitle] = useState('');
    const [formError, setFormError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);

    async function loadTodos() {
        try {
            const response = await fetch('/api/todos', { cache: 'no-store' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Unable to load todos.');
            setTodos(result.todos);
            setErrorMessage('');
        } catch (error) {
            setErrorMessage(error.message || 'Unable to load todos.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadTodos();
    }, []);

    async function addTodo(event) {
        event.preventDefault();
        setFormError('');
        setIsSaving(true);
        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.errors?.title || result.error || 'Unable to add todo.');
            setTodos((current) => [result.todo, ...current]);
            setTitle('');
        } catch (error) {
            setFormError(error.message);
        } finally {
            setIsSaving(false);
        }
    }

    async function changeStatus(todo, status) {
        setBusyId(todo.id);
        try {
            const response = await fetch(`/api/todos/${todo.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || 'Unable to update todo.');
            setTodos((current) => current.map((item) => (item.id === todo.id ? result.todo : item)));
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setBusyId(null);
        }
    }

    async function deleteTodo(todo) {
        if (!window.confirm(`Delete "${todo.title}"?`)) return;
        setBusyId(todo.id);
        try {
            const response = await fetch(`/api/todos/${todo.id}`, { method: 'DELETE' });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.error || 'Unable to delete todo.');
            }
            setTodos((current) => current.filter((item) => item.id !== todo.id));
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setBusyId(null);
        }
    }

    const pending = todos.filter((todo) => todo.status === 'pending');
    const completed = todos
        .filter((todo) => todo.status === 'completed')
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    return (
        <main className="min-h-screen bg-gray-100 p-6">
            <div className="mx-auto max-w-5xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">To Do</h1>
                    <p className="text-sm text-gray-500">
                        Add your todos and mark them completed when they are done.
                    </p>
                </div>

                <form onSubmit={addTodo} className="rounded-lg bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-end gap-3">
                        <label className="block min-w-[240px] flex-1 text-sm font-medium text-gray-700">
                            My Todo
                            <input
                                type="text"
                                required
                                maxLength={200}
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder="What do you need to do?"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isSaving ? 'Adding…' : 'Add Todo'}
                        </button>
                    </div>
                    {formError && (
                        <p role="alert" className="mt-2 text-sm text-red-600">
                            {formError}
                        </p>
                    )}
                </form>

                {errorMessage && (
                    <p role="alert" className="text-sm text-red-600">
                        {errorMessage}
                    </p>
                )}

                {isLoading ? (
                    <p className="text-sm text-gray-500">Loading todos...</p>
                ) : (
                    <>
                        <TodoTable
                            title="Pending"
                            todos={pending}
                            emptyText="Nothing pending. Add a todo above."
                            busyId={busyId}
                            onStatus={changeStatus}
                            onDelete={deleteTodo}
                        />
                        <TodoTable
                            title="Completed"
                            todos={completed}
                            emptyText="No completed todos yet."
                            busyId={busyId}
                            onStatus={changeStatus}
                            onDelete={deleteTodo}
                        />
                    </>
                )}
            </div>
        </main>
    );
}
