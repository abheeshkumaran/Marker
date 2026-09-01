'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString();
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savingId, setSavingId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/payments');
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'Failed to load payments.');
            setPayments(body.payments);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const changeStatus = async (id, status) => {
        setSavingId(id);
        try {
            const res = await fetch(`/api/payments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            const body = await res.json();
            if (res.ok) {
                setPayments((list) =>
                    list.map((p) => (p.id === id ? body.payment : p)),
                );
            }
        } finally {
            setSavingId(null);
        }
    };

    return (
        <main className="min-h-screen bg-gray-100 p-6">
            <div className="mx-auto max-w-4xl">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
                    <Link
                        href="/"
                        className="text-sm font-medium text-indigo-600 underline"
                    >
                        Back to home
                    </Link>
                </div>

                {loading && <p className="text-sm text-gray-500">Loading…</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}

                {!loading && !error && (
                    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-500">
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium">Due payment</th>
                                    <th className="px-4 py-3 font-medium">Transfer to</th>
                                    <th className="px-4 py-3 font-medium">No. of pendings</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-gray-500">
                                            No payments yet.
                                        </td>
                                    </tr>
                                )}
                                {payments.map((p) => (
                                    <tr key={p.id} className="border-b border-gray-100">
                                        <td className="px-4 py-3 text-gray-900">
                                            {fmtDate(p.date)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900">
                                            {p.duePayment}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900">
                                            {p.transferTo}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-gray-900">
                                            {p.paidCount}/{p.noOfPendings}
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={p.status}
                                                disabled={savingId === p.id}
                                                onChange={(e) =>
                                                    changeStatus(p.id, e.target.value)
                                                }
                                                className={
                                                    'rounded-md border px-2 py-1 text-xs font-semibold ' +
                                                    (p.status === 'paid'
                                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                        : 'border-amber-300 bg-amber-50 text-amber-700')
                                                }
                                            >
                                                <option value="pending">pending</option>
                                                <option value="paid">paid</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>
    );
}
