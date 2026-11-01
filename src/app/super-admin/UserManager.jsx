'use client';

import { useCallback, useEffect, useState } from 'react';

const emptyForm = { username: '', password: '', role: 'user' };

function formatDate(date) {
    return new Date(date).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function UserManager({ onChange }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState('');
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState({ type: '', text: '' });
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/users', { cache: 'no-store' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Unable to load users.');
            setUsers(result.users);
            setListError('');
        } catch (error) {
            setListError(error.message || 'Unable to load users.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    function update(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
    }

    function startEdit(user) {
        setEditingId(user.id);
        setForm({ username: user.username, password: '', role: user.role });
        setErrors({});
        setMessage({ type: '', text: '' });
    }

    function cancelEdit() {
        setEditingId(null);
        setForm(emptyForm);
        setErrors({});
    }

    async function submit(event) {
        event.preventDefault();
        setSaving(true);
        setErrors({});
        setMessage({ type: '', text: '' });
        try {
            const response = await fetch(editingId ? `/api/admin/users/${editingId}` : '/api/admin/users', {
                method: editingId ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (result.errors) {
                    setErrors(result.errors);
                    return;
                }
                throw new Error(result.error || 'Unable to save user.');
            }
            setMessage({
                type: 'success',
                text: editingId ? `Updated ${result.user.username}.` : `Created ${result.user.username}.`,
            });
            cancelEdit();
            await load();
            onChange?.();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    }

    async function remove(user) {
        if (
            !window.confirm(
                `Delete ${user.username}? Their income, expenses, reminders, rentals and todos will be deleted too.`,
            )
        ) {
            return;
        }
        setBusyId(user.id);
        setMessage({ type: '', text: '' });
        try {
            const response = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || 'Unable to delete user.');
            if (editingId === user.id) cancelEdit();
            setMessage({ type: 'success', text: `Deleted ${user.username}.` });
            await load();
            onChange?.();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setBusyId(null);
        }
    }

    const inputClass =
        'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

    return (
        <section aria-label="Manage users" className="mb-8 space-y-4">
            <form onSubmit={submit} className="rounded-lg bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-bold text-gray-900">
                    {editingId ? 'Edit user' : 'Create user'}
                </h2>
                <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block text-sm font-medium text-gray-700">
                        Username
                        <input
                            type="text"
                            required
                            maxLength={60}
                            autoComplete="off"
                            value={form.username}
                            onChange={(event) => update('username', event.target.value)}
                            className={inputClass}
                        />
                        {errors.username && (
                            <span className="mt-1 block text-xs text-red-600">{errors.username}</span>
                        )}
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                        Password
                        {editingId && <span className="font-normal text-gray-400"> (blank = keep current)</span>}
                        <input
                            type="password"
                            required={!editingId}
                            minLength={4}
                            autoComplete="new-password"
                            value={form.password}
                            onChange={(event) => update('password', event.target.value)}
                            className={inputClass}
                        />
                        {errors.password && (
                            <span className="mt-1 block text-xs text-red-600">{errors.password}</span>
                        )}
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                        Role
                        <select
                            value={form.role}
                            onChange={(event) => update('role', event.target.value)}
                            className={inputClass}
                        >
                            <option value="user">User</option>
                            <option value="superadmin">Super admin</option>
                        </select>
                        {errors.role && <span className="mt-1 block text-xs text-red-600">{errors.role}</span>}
                    </label>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : editingId ? 'Update User' : 'Create User'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    )}
                    {message.text && (
                        <p
                            role={message.type === 'error' ? 'alert' : 'status'}
                            className={
                                'text-sm ' + (message.type === 'error' ? 'text-red-600' : 'text-emerald-700')
                            }
                        >
                            {message.text}
                        </p>
                    )}
                </div>
            </form>

            <div className="rounded-lg bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-bold text-gray-900">All users ({users.length})</h2>
                {listError && (
                    <p role="alert" className="mb-3 text-sm text-red-600">
                        {listError}
                    </p>
                )}
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-gray-500">
                                <th className="px-4 py-3 font-medium">Username</th>
                                <th className="px-4 py-3 font-medium">Role</th>
                                <th className="px-4 py-3 font-medium">Connecting code</th>
                                <th className="px-4 py-3 font-medium">Created</th>
                                <th className="px-4 py-3 text-right font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-gray-500">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-gray-500">
                                        No users yet.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className={
                                            'border-b border-gray-100 last:border-0 ' +
                                            (editingId === user.id ? 'bg-indigo-50' : '')
                                        }
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-900">{user.username}</td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <span
                                                className={
                                                    'rounded-full px-2.5 py-1 text-xs font-semibold ' +
                                                    (user.role === 'superadmin'
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : 'bg-gray-100 text-gray-700')
                                                }
                                            >
                                                {user.role === 'superadmin' ? 'Super admin' : 'User'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-600">
                                            {user.connectingCode || '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                            {formatDate(user.createdAt)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right">
                                            {user.managedByEnv ? (
                                                <span className="text-xs text-gray-400">Managed in .env</span>
                                            ) : (
                                                <div className="inline-flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(user)}
                                                        disabled={busyId === user.id}
                                                        className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => remove(user)}
                                                        disabled={busyId === user.id}
                                                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                                    >
                                                        {busyId === user.id ? 'Deleting…' : 'Delete'}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
