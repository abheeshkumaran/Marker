'use client';

import { useEffect, useState } from 'react';

export default function SourcesPage() {
    const [sources, setSources] = useState([]);
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        async function loadSources() {
            try {
                const response = await fetch('/api/income-sources', { cache: 'no-store' });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Unable to load sources.');
                setSources(result.items);
            } catch (error) {
                setErrorMessage(error.message || 'Unable to load sources.');
            } finally {
                setIsLoading(false);
            }
        }

        loadSources();
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');
        try {
            const response = await fetch('/api/income-sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            const result = await response.json();
            if (!response.ok) {
                const validationMessage = result.errors
                    ? Object.values(result.errors).join(' ')
                    : result.error;
                throw new Error(validationMessage || 'Unable to save source.');
            }
            setSources((list) =>
                [...list, result.item].sort((a, b) => a.name.localeCompare(b.name)),
            );
            setName('');
        } catch (error) {
            setErrorMessage(error.message || 'Unable to save source.');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function removeSource(id) {
        setDeletingId(id);
        setErrorMessage('');
        try {
            const response = await fetch(`/api/income-sources/${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Unable to delete source.');
            setSources((list) => list.filter((source) => source.id !== id));
        } catch (error) {
            setErrorMessage(error.message || 'Unable to delete source.');
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <main className="min-h-screen bg-gray-100 p-6">
            <div className="mx-auto max-w-xl">
                <h1 className="mb-1 text-2xl font-bold text-gray-900">Income Sources</h1>
                <p className="mb-6 text-sm text-gray-600">
                    Sources you add here appear in the Source dropdown on the Income form.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mb-6 flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm sm:flex-row"
                >
                    <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                        maxLength={60}
                        placeholder="e.g. Salary, Freelance, Rent"
                        aria-label="Source name"
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {isSubmitting ? 'Adding...' : 'Add Source'}
                    </button>
                </form>

                {errorMessage && (
                    <p role="alert" className="mb-4 text-sm text-red-600">
                        {errorMessage}
                    </p>
                )}

                <section className="rounded-lg bg-white shadow-sm">
                    {isLoading ? (
                        <p className="p-4 text-sm text-gray-500">Loading sources...</p>
                    ) : sources.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500">No sources yet. Add your first one above.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {sources.map((source) => (
                                <li
                                    key={source.id}
                                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                                >
                                    <span className="font-medium text-gray-900">{source.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeSource(source.id)}
                                        disabled={deletingId === source.id}
                                        className="text-sm font-medium text-rose-600 hover:underline disabled:opacity-50"
                                    >
                                        {deletingId === source.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
}
