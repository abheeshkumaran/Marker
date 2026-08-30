'use client';

export default function Error({ error, reset }) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-100 p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
            <p className="max-w-md text-sm text-gray-600">{error?.message || 'Unexpected error.'}</p>
            <button
                onClick={() => reset()}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
                Try again
            </button>
        </main>
    );
}
