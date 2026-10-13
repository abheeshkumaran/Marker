'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff } from '@/components/EyeIcons';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
            const response = await fetch('/api/talk/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(
                    result.errors
                        ? Object.values(result.errors).join(' ')
                        : result.error || result.message || 'Unable to sign in.',
                );
            }
            router.replace(result.role === 'superadmin' ? '/super-admin' : '/');
            router.refresh();
        } catch (submitError) {
            setError(submitError.message || 'Unable to sign in.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
            <section className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
                <h1 className="text-xl font-bold text-gray-900">Sign in</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Your income, expenses, and balance are private to your account.
                </p>
                <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        User ID
                        <input
                            type="text"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            autoComplete="username"
                            required
                            className="rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                        />
                    </label>
                    <div className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        <label htmlFor="login-password">Password</label>
                        <div className="relative">
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="current-password"
                                required
                                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-gray-900"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((visible) => !visible)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                    </div>
                    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                    <button
                        type="submit"
                        disabled={busy}
                        className="rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {busy ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
                <p className="mt-4 text-sm text-gray-600">
                    New user?{' '}
                    <Link href="/register" className="font-medium text-indigo-600 underline">
                        Create an account
                    </Link>
                </p>
            </section>
        </main>
    );
}
