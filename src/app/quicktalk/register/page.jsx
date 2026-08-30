'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function QuickTalkRegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors({});

        const res = await fetch('/api/talk/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const body = await res.json().catch(() => ({}));
        setBusy(false);

        if (res.ok) {
            router.push('/quicktalk/chat');
            router.refresh();
            return;
        }

        setErrors(body.errors || { username: body.message || 'Registration failed.' });
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
            <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
                <h1 className="text-xl font-bold text-gray-900">QuickTalk — Register</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Choose a username and password.
                </p>

                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.username && (
                            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={busy}
                        className="w-full rounded-md bg-gray-800 px-4 py-2 font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
                    >
                        {busy ? 'Creating…' : 'Create account'}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/quicktalk" className="font-medium text-indigo-600 underline">
                        Log in
                    </Link>
                </div>
            </div>
        </main>
    );
}
