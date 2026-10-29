'use client';

import { useCallback, useEffect, useState } from 'react';

function formatDate(date) {
    return new Date(date).toLocaleDateString(undefined, { timeZone: 'UTC' });
}

function formatAmount(amount) {
    return Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function todayString() {
    const today = new Date();
    return new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 10);
}

function statusOf(payment) {
    if (payment.status === 'paid') return 'completed';
    return new Date(payment.date).toISOString().slice(0, 10) < todayString() ? 'overdue' : 'pending';
}

const statusStyles = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    overdue: 'bg-rose-50 text-rose-700 ring-rose-200',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

const emptyForm = { date: '', transferTo: '', duePayment: '', noOfPendings: '', paidCount: '' };

function AddReminderForm({ onClose, onCreated }) {
    const [form, setForm] = useState(() => ({ ...emptyForm, date: todayString() }));
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const total = Number(form.noOfPendings);
    const nextInstallment = (Number(form.paidCount) || 0) + 1;

    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setErrors({});
        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                setErrors(body.errors || { _form: body.error || 'Could not save the reminder.' });
                return;
            }
            onCreated(body.payment);
        } catch {
            setErrors({ _form: 'Could not save the reminder.' });
        } finally {
            setBusy(false);
        }
    }

    const fields = [
        { key: 'date', label: 'Next payment date', type: 'date' },
        { key: 'transferTo', label: 'Payment info', type: 'text', placeholder: 'e.g. Car loan to HDFC' },
        { key: 'duePayment', label: 'Amount per installment', type: 'number', min: '0', step: 'any' },
        { key: 'noOfPendings', label: 'Total installments', type: 'number', min: '1', step: '1' },
        {
            key: 'paidCount',
            label: 'Installments already paid',
            type: 'number',
            min: '0',
            step: '1',
            placeholder: '0',
            optional: true,
        },
    ];

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <form
                onSubmit={submit}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-reminder-title"
                className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-xl"
            >
                <div className="mb-1 flex items-center justify-between">
                    <h3 id="add-reminder-title" className="text-lg font-bold text-gray-900">
                        Add Reminder
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close add reminder form"
                        className="rounded-md px-2 text-2xl leading-none text-gray-400 hover:text-gray-600"
                    >
                        &times;
                    </button>
                </div>

                {errors._form && (
                    <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-700">
                        {errors._form}
                    </p>
                )}

                {fields.map(({ key, label, optional, ...input }) => (
                    <label key={key} className="block text-sm font-medium text-gray-700">
                        {label}
                        {optional && <span className="font-normal text-gray-400"> (optional)</span>}
                        <input
                            {...input}
                            value={form[key]}
                            onChange={(event) => set(key, event.target.value)}
                            required={!optional}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors[key] && <span className="mt-1 block text-xs text-red-600">{errors[key]}</span>}
                    </label>
                ))}

                {Number.isInteger(total) && total >= 1 && nextInstallment <= total && (
                    <p className="rounded-md bg-indigo-50 p-2 text-sm text-indigo-800">
                        Next payment will be installment <strong>{nextInstallment}/{total}</strong>.
                    </p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={busy}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {busy ? 'Saving…' : 'Add Reminder'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function PaymentReminders() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/payments', { cache: 'no-store' });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || 'Failed to load reminders.');
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

    async function update(id, action) {
        if (action === 'delete' && !window.confirm('Delete this reminder?')) return;
        setBusyId(id);
        setError('');
        try {
            const response = await fetch(`/api/payments/${id}`, {
                method: action === 'delete' ? 'DELETE' : 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: action === 'delete' ? undefined : JSON.stringify({ action }),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || 'Could not update the reminder.');
            setPayments((list) =>
                action === 'delete'
                    ? list.filter((p) => p.id !== id)
                    : list.map((p) => (p.id === id ? body.payment : p)),
            );
        } catch (e) {
            setError(e.message);
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div>
            <div className="mb-4 flex justify-end">
                <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
                >
                    + Add Reminder
                </button>
            </div>

            {error && (
                <p role="alert" className="mb-3 text-sm text-red-600">
                    {error}
                </p>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 text-gray-500">
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Payment info</th>
                            <th className="px-4 py-3 font-medium">Installment</th>
                            <th className="px-4 py-3 font-medium">Payment status</th>
                            <th className="px-4 py-3 text-right font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-gray-500">
                                    Loading…
                                </td>
                            </tr>
                        ) : payments.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-gray-500">
                                    No reminders yet. Click Add Reminder to create one.
                                </td>
                            </tr>
                        ) : (
                            payments.map((p) => {
                                const status = statusOf(p);
                                const completed = status === 'completed';
                                const busy = busyId === p.id;
                                return (
                                    <tr key={p.id} className="border-b border-gray-100 last:border-0">
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                                            {completed ? '—' : formatDate(p.date)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{p.transferTo}</p>
                                            <p className="text-xs text-gray-500">
                                                {formatAmount(p.duePayment)} per installment
                                            </p>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <p className="font-mono font-semibold text-gray-900">
                                                {completed ? p.noOfPendings : p.paidCount + 1}/{p.noOfPendings}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {completed ? 'all paid' : `${p.paidCount} paid`}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${statusStyles[status]}`}
                                            >
                                                {status}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right">
                                            <div className="inline-flex gap-2">
                                                {!completed && (
                                                    <button
                                                        type="button"
                                                        onClick={() => update(p.id, 'pay')}
                                                        disabled={busy}
                                                        className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                                    >
                                                        Mark paid
                                                    </button>
                                                )}
                                                {p.paidCount > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => update(p.id, 'undo')}
                                                        disabled={busy}
                                                        className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                                    >
                                                        Undo
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => update(p.id, 'delete')}
                                                    disabled={busy}
                                                    className="rounded-md px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <AddReminderForm
                    onClose={() => setShowForm(false)}
                    onCreated={() => {
                        setShowForm(false);
                        load();
                    }}
                />
            )}
        </div>
    );
}
