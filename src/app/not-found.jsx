import Link from 'next/link';

export default function NotFound() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-100 p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">404 — Not found</h1>
            <Link href="/" className="text-sm font-medium text-indigo-600 underline">
                Back to home
            </Link>
        </main>
    );
}
