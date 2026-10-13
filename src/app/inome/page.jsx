'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function IncomePage() {
    const router = useRouter();
    const [incomeDate, setIncomeDate] = useState('');
    const [source, setSource] = useState('');
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const today = new Date();
        const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
            .toISOString()
            .slice(0, 10);
        setIncomeDate(localDate);
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const response = await fetch('/api/income', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: incomeDate, source, amount }),
            });
            const result = await response.json();

            if (!response.ok) {
                const validationMessage = result.errors
                    ? Object.values(result.errors).join(' ')
                    : result.error;
                throw new Error(validationMessage || 'Unable to save income.');
            }

            router.push('/');
        } catch (error) {
            setErrorMessage(error.message || 'Unable to save income.');
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
                aria-labelledby="income-dialog-title"
                className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            >
                <div className="mb-5 flex items-center justify-between">
                    <h1 id="income-dialog-title" className="text-xl font-bold text-gray-900">
                        Add Income
                    </h1>
                    <Link
                        href="/"
                        aria-label="Close income form"
                        className="rounded-md px-3 py-1 text-2xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    >
                        &times;
                    </Link>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Income Date
                        <input
                            type="date"
                            value={incomeDate}
                            onChange={(event) => setIncomeDate(event.target.value)}
                            required
                            className="rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Select Source
                        <select
                            value={source}
                            onChange={(event) => setSource(event.target.value)}
                            required
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
                        >
                            <option value="" disabled>
                                Choose a source
                            </option>
                            <option value="salary">Salary</option>
                            <option value="business">Business</option>
                            <option value="investment">Investment</option>
                            <option value="other">Other</option>
                        </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Add Your Income
                        <input
                            type="number"
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                            min="0"
                            step="0.01"
                            required
                            placeholder="Enter income amount"
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
                        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-emerald-700"
                    >
                        {isSubmitting ? 'Saving...' : 'Add Your Income'}
                    </button>
                </form>
            </section>
        </main>
    );
}
