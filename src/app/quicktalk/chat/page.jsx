'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuickTalkChatPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);
    const [items, setItems] = useState([]);
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);

    const loadActivity = useCallback(async () => {
        const res = await fetch('/api/talk/activity');
        if (res.ok) {
            const body = await res.json();
            setItems(body.items);
        }
    }, []);

    // Identify this browser's user; bounce to login if there's no session.
    useEffect(() => {
        (async () => {
            const res = await fetch('/api/talk/me');
            if (!res.ok) {
                router.replace('/quicktalk');
                return;
            }
            const body = await res.json();
            setUser(body.user);
            setChecking(false);
            loadActivity();
        })();
    }, [router, loadActivity]);

    const addItem = async (e) => {
        e.preventDefault();
        const value = text.trim();
        if (!value) return;
        setBusy(true);
        const res = await fetch('/api/talk/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: value }),
        });
        setBusy(false);
        if (res.ok) {
            const body = await res.json();
            setItems((list) => [body.item, ...list]);
            setText('');
        }
    };

    const logout = async () => {
        await fetch('/api/talk/logout', { method: 'POST' });
        router.replace('/quicktalk');
    };

    if (checking) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-100">
                <p className="text-sm text-gray-500">Loading…</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-100 p-6">
            <div className="mx-auto max-w-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">
                        here is the chat landing section
                    </h1>
                    <button
                        onClick={logout}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Log out
                    </button>
                </div>

                <p className="mb-6 text-sm text-gray-600">
                    Signed in as <strong>{user.username}</strong>. Everything below is
                    private to your account.
                </p>

                <form onSubmit={addItem} className="mb-4 flex gap-2">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Add to your activity…"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <button
                        type="submit"
                        disabled={busy}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Add
                    </button>
                </form>

                <ul className="space-y-2">
                    {items.length === 0 && (
                        <li className="text-sm text-gray-500">No activity yet.</li>
                    )}
                    {items.map((it) => (
                        <li
                            key={it.id}
                            className="rounded-md bg-white p-3 text-sm text-gray-800 shadow-sm"
                        >
                            <div>{it.text}</div>
                            <div className="mt-1 text-xs text-gray-400">
                                {new Date(it.createdAt).toLocaleString()}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </main>
    );
}
