'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function formatAmount(amount) {
    return Number(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

export default function SuperAdminPage() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const response = await fetch('/api/super-admin/users', { cache: 'no-store' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Unable to load accounts.');
            setUsers(result.users);
        } catch (error) {
            setErrorMessage(error.message || 'Unable to load accounts.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    async function logout() {
        const response = await fetch('/api/talk/logout', { method: 'POST' });
        if (!response.ok) {
            setErrorMessage('Unable to sign out.');
            return;
        }
        router.replace('/login');
    }

    return (
        <main className="min-h-screen bg-gray-100 p-6">
            <div className="mx-auto max-w-5xl">
                <header className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Super Admin Panel</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Account income, expenses, and current balances
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={logout}
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow hover:bg-gray-50"
                    >
                        Sign out
                    </button>
                </header>

                {loading && <p role="status" className="text-sm text-gray-500">Loading accounts...</p>}
                {errorMessage && <p role="alert" className="text-sm text-red-600">{errorMessage}</p>}
                {!loading && !errorMessage && users.length === 0 && (
                    <div className="rounded-lg bg-white p-6 text-sm text-gray-500 shadow-sm">
                        No user accounts yet.
                    </div>
                )}
                {!loading && !errorMessage && (
                    <section aria-label="User financial summaries" className="space-y-4">
                        {users.map((user) => (
                            <article key={user.id} className="rounded-lg bg-white p-5 shadow-sm">
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">
                                            {user.username}
                                        </h2>
                                        <p className="text-xs text-gray-500">User ID: {user.id}</p>
                                    </div>
                                    <p className="rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900">
                                        Current balance: {formatAmount(user.currentBalance)}
                                    </p>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <section>
                                        <h3 className="mb-2 font-semibold text-emerald-700">
                                            Income ({user.income.length})
                                        </h3>
                                        {user.income.length === 0 ? (
                                            <p className="text-sm text-gray-500">No income records.</p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {user.income.map((income, index) => (
                                                    <li
                                                        key={`${user.id}-income-${index}`}
                                                        className="flex justify-between gap-3 border-b border-gray-100 pb-2 text-sm"
                                                    >
                                                        <span className="text-gray-700">
                                                            {formatDate(income.date)} · {income.source}
                                                        </span>
                                                        <span className="font-medium text-emerald-700">
                                                            +{formatAmount(income.amount)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </section>
                                    <section>
                                        <h3 className="mb-2 font-semibold text-rose-700">
                                            Expenses ({user.expenses.length})
                                        </h3>
                                        {user.expenses.length === 0 ? (
                                            <p className="text-sm text-gray-500">No expense records.</p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {user.expenses.map((expense, index) => (
                                                    <li
                                                        key={`${user.id}-expense-${index}`}
                                                        className="flex justify-between gap-3 border-b border-gray-100 pb-2 text-sm"
                                                    >
                                                        <span className="text-gray-700">
                                                            {formatDate(expense.date)} · {expense.purpose}
                                                        </span>
                                                        <span className="font-medium text-rose-700">
                                                            -{formatAmount(expense.amount)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </section>
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </div>
        </main>
    );
}
