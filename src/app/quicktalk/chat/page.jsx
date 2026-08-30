'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuickTalkChatPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [storeChat, setStoreChat] = useState(false); // false = clear after chat
    const [copied, setCopied] = useState(false);

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

            try {
                const saved = localStorage.getItem(`qt_store_${body.user.id}`);
                if (saved !== null) setStoreChat(saved === '1');
            } catch {}
        })();
    }, [router]);

    const toggleStore = () => {
        setStoreChat((v) => {
            const next = !v;
            try {
                localStorage.setItem(`qt_store_${user.id}`, next ? '1' : '0');
            } catch {}
            return next;
        });
    };

    const copyCode = async () => {
        if (!user?.connectingCode) return;
        try {
            await navigator.clipboard.writeText(user.connectingCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {}
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
            <div className="mx-auto max-w-2xl">
                <div className="flex items-start justify-between gap-4">
                    {/* Left side */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">quick chat</h1>

                        <p className="mt-2 text-sm text-gray-600">
                            Signed in as <strong>{user.username}</strong>. Everything
                            below is private to your account.
                        </p>

                        <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
                            <p className="text-sm text-gray-700">
                                This chat will clear after the chat concludes — do you
                                want to store or clear it?
                            </p>

                            <button
                                type="button"
                                onClick={toggleStore}
                                role="switch"
                                aria-checked={storeChat}
                                className="mt-3 flex items-center gap-3"
                            >
                                <span
                                    className={
                                        'relative inline-flex h-6 w-11 items-center rounded-full transition ' +
                                        (storeChat ? 'bg-emerald-600' : 'bg-gray-300')
                                    }
                                >
                                    <span
                                        className={
                                            'inline-block h-5 w-5 transform rounded-full bg-white shadow transition ' +
                                            (storeChat ? 'translate-x-5' : 'translate-x-1')
                                        }
                                    />
                                </span>
                                <span className="text-sm font-medium text-gray-800">
                                    {storeChat ? 'Allow (store chat)' : 'Not allow (clear chat)'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowSettings((v) => !v)}
                            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                                aria-hidden="true"
                            >
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.2.61.79 1.03 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            Settings
                        </button>

                        {showSettings && (
                            <div className="mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                                <div className="text-sm font-semibold text-gray-900">
                                    {user.username}
                                </div>

                                <div className="mt-2 text-xs uppercase tracking-wide text-gray-400">
                                    Connecting code
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <code className="flex-1 rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-800">
                                        {user.connectingCode || '—'}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={copyCode}
                                        disabled={!user.connectingCode}
                                        className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={logout}
                                    className="mt-4 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Log out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
