'use client';

import { useCallback, useEffect, useState } from 'react';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/users');
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'Failed to load users.');
            setUsers(body.users);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const remove = async (id, username) => {
        if (!confirm(`Delete user "${username}"?`)) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Delete failed.');
            }
            setUsers((list) => list.filter((u) => u.id !== id));
        } catch (e) {
            alert(e.message);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900">Users</h1>
                <button
                    onClick={load}
                    className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                >
                    Refresh
                </button>
            </div>

            {loading && <p className="text-sm text-gray-500">Loading…</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && (
                <table className="w-full border-collapse text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 text-gray-500">
                            <th className="py-2 pr-4 font-medium">Username</th>
                            <th className="py-2 pr-4 font-medium">Connecting code</th>
                            <th className="py-2 font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={3} className="py-4 text-gray-500">
                                    No users yet.
                                </td>
                            </tr>
                        )}
                        {users.map((u) => (
                            <tr key={u.id} className="border-b border-gray-100">
                                <td className="py-2 pr-4 text-gray-900">{u.username}</td>
                                <td className="py-2 pr-4">
                                    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-800">
                                        {u.connectingCode || '—'}
                                    </code>
                                </td>
                                <td className="py-2">
                                    <button
                                        onClick={() => remove(u.id, u.username)}
                                        disabled={deletingId === u.id}
                                        className="rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                                    >
                                        {deletingId === u.id ? 'Deleting…' : 'Delete'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
