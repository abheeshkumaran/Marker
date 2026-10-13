'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function BellIcon(props) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
    );
}

const emptyForm = { date: '', duePayment: '', transferTo: '', noOfPendings: '' };

export default function PaymentsReminder() {
    const router = useRouter();
    const [open, setOpen] = useState(false); // popup with the two choices
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    const close = () => {
        setOpen(false);
        setShowForm(false);
        setForm(emptyForm);
        setErrors({});
    };

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const create = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors({});
        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const body = await res.json().catch(() => ({}));
            if (res.ok) {
                close();
                router.push('/payments');
            } else {
                setErrors(body.errors || { _form: body.error || 'Could not save.' });
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex min-h-24 w-full items-center gap-3 rounded-lg bg-amber-600 px-5 py-3 text-base font-semibold text-white shadow transition hover:bg-amber-700"
            >
                <BellIcon className="h-5 w-5 shrink-0" />
                <span>Payments reminder</span>
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={close}
                >
                    <div
                        className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">
                                Payments reminder
                            </h2>
                            <button
                                type="button"
                                onClick={close}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {!showForm ? (
                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        close();
                                        router.push('/payments');
                                    }}
                                    className="rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                    Mark payment
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(true)}
                                    className="rounded-md border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                                >
                                    Mark a new reminder
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={create} className="space-y-3">
                                {errors._form && (
                                    <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">
                                        {errors._form}
                                    </p>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Payment date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => set('date', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.date && (
                                        <p className="mt-1 text-xs text-red-600">{errors.date}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Due payment
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={form.duePayment}
                                        onChange={(e) => set('duePayment', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.duePayment && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.duePayment}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Transfer to
                                    </label>
                                    <input
                                        type="text"
                                        value={form.transferTo}
                                        onChange={(e) => set('transferTo', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.transferTo && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.transferTo}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        No. of pendings
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={form.noOfPendings}
                                        onChange={(e) => set('noOfPendings', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.noOfPendings && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.noOfPendings}
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={busy}
                                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {busy ? 'Saving…' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
