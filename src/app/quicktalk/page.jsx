'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function QuickTalkLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [notice, setNotice] = useState(null);
    const [noAccount, setNoAccount] = useState(false);
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors({});
        setNotice(null);
        setNoAccount(false);

        let res;
        let body = {};
        try {
            res = await fetch('/api/talk/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            body = await res.json().catch(() => ({}));
        } catch {
            setBusy(false);
            setErrors({ _form: 'Network error — is the server running?' });
            return;
        }
        setBusy(false);

        if (res.ok) {
            router.push('/quicktalk/chat');
            router.refresh();
            return;
        }

        if (res.status === 404 && body.code === 'no-account') {
            setNoAccount(true);
            setNotice(body.message);
            return;
        }

        if (body.errors) {
            setErrors(body.errors);
        } else {
            setErrors({ _form: body.message || `Login failed (HTTP ${res.status}).` });
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
            <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
                <h1 className="text-xl font-bold text-gray-900">QuickTalk — Log in</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Enter your username and password.
                </p>

                {notice && (
                    <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                        {notice}
                    </div>
                )}

                {errors._form && (
                    <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                        {errors._form}
                    </div>
                )}

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
                            autoComplete="current-password"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={busy}
                        className="w-full rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {busy ? 'Checking…' : 'Log in'}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-gray-600">
                    {noAccount ? (
                        <Link
                            href="/quicktalk/register"
                            className="inline-block rounded-md bg-gray-800 px-4 py-2 font-semibold text-white hover:bg-gray-700"
                        >
                            Create an account
                        </Link>
                    ) : (
                        <>
                            Don&apos;t have a password?{' '}
                            <Link
                                href="/quicktalk/register"
                                className="font-medium text-indigo-600 underline"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
