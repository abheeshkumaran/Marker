'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ExpensePage() {
    const router = useRouter();
    const [expenseDate, setExpenseDate] = useState('');
    const [purpose, setPurpose] = useState('');
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const today = new Date();
        const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
            .toISOString()
            .slice(0, 10);
        setExpenseDate(localDate);
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: expenseDate, purpose, amount }),
            });
            const result = await response.json();

            if (!response.ok) {
                const validationMessage = result.errors
                    ? Object.values(result.errors).join(' ')
                    : result.error;
                throw new Error(validationMessage || 'Unable to save expense.');
            }

            router.push('/');
        } catch (error) {
            setErrorMessage(error.message || 'Unable to save expense.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="expense-dialog-title"
                className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            >
                <div className="mb-5 flex items-center justify-between">
                    <h1 id="expense-dialog-title" className="text-xl font-bold text-gray-900">
                        mark your expences
                    </h1>
                    <Link
                        href="/"
                        aria-label="Close expense form"
                        className="rounded-md px-3 py-1 text-2xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    >
                        &times;
                    </Link>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Date
                        <input
                            type="date"
                            value={expenseDate}
                            onChange={(event) => setExpenseDate(event.target.value)}
                            required
                            className="rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Expense For
                        <input
                            type="text"
                            value={purpose}
                            onChange={(event) => setPurpose(event.target.value)}
                            required
                            placeholder="What was the expense for?"
                            className="rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Mark Your Expense
                        <input
                            type="number"
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                            min="0"
                            step="0.01"
                            required
                            placeholder="Enter expense amount"
                            className="rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                        />
                    </label>
                    {errorMessage && (
                        <p role="alert" className="text-sm text-red-600">
                            {errorMessage}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-rose-700"
                    >
                        {isSubmitting ? 'Saving...' : 'Mark Your Expense'}
                    </button>
                </form>
            </section>
        </main>
    );
}
