'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

function todayString() {
    const today = new Date();
    return new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 10);
}

export default function IncomePage() {
    const [incomeDate, setIncomeDate] = useState('');
    const [sources, setSources] = useState([]);
    const [sourceId, setSourceId] = useState('');
    const [otherSource, setOtherSource] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoadingSources, setIsLoadingSources] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        setIncomeDate(todayString());

        async function loadSources() {
            try {
                const response = await fetch('/api/income-sources', { cache: 'no-store' });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Unable to load sources.');
                setSources(result.items);
            } catch (error) {
                setErrorMessage(error.message || 'Unable to load sources.');
            } finally {
                setIsLoadingSources(false);
            }
        }

        loadSources();
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const response = await fetch('/api/income', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: incomeDate, sourceId, otherSource, amount }),
            });
            const result = await response.json();

            if (!response.ok) {
                const validationMessage = result.errors
                    ? Object.values(result.errors).join(' ')
                    : result.error;
                throw new Error(validationMessage || 'Unable to save income.');
            }

            setSuccessMessage(`Added ${result.income.amount} from ${result.income.source}.`);
            setSourceId('');
            setOtherSource('');
            setAmount('');
        } catch (error) {
            setErrorMessage(error.message || 'Unable to save income.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
            <section
                aria-labelledby="income-title"
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            >
                <h1 id="income-title" className="mb-5 text-xl font-bold text-gray-900">
                    Add Income
                </h1>
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
                        Source
                        <select
                            value={sourceId}
                            onChange={(event) => setSourceId(event.target.value)}
                            required
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
                        >
                            <option value="" disabled>
                                {isLoadingSources ? 'Loading sources...' : 'Choose a source'}
                            </option>
                            {sources.map((source) => (
                                <option key={source.id} value={source.id}>
                                    {source.name}
                                </option>
                            ))}
                            <option value="other">Other</option>
                        </select>
                        {!isLoadingSources && sources.length === 0 && (
                            <span className="text-xs font-normal text-gray-500">
                                No saved sources yet.{' '}
                                <Link href="/sources" className="text-indigo-600 underline">
                                    Add sources
                                </Link>{' '}
                                or choose Other.
                            </span>
                        )}
                    </label>
                    {sourceId === 'other' && (
                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                            Your Income Source
                            <input
                                type="text"
                                value={otherSource}
                                onChange={(event) => setOtherSource(event.target.value)}
                                required
                                maxLength={60}
                                placeholder="Where did this income come from?"
                                className="rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                            />
                        </label>
                    )}
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
                    {successMessage && (
                        <p role="status" className="text-sm text-emerald-700">
                            {successMessage}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {isSubmitting ? 'Saving...' : 'Add'}
                    </button>
                </form>
            </section>
        </main>
    );
}
