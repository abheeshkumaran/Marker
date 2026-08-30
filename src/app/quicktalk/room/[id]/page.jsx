'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const ONLINE_WINDOW_MS = 35_000;

function lastSeenText(iso, now = Date.now()) {
    if (!iso) return 'last seen recently';
    const d = new Date(iso);
    const diff = now - d.getTime();
    if (diff < ONLINE_WINDOW_MS) return 'online';

    const nd = new Date(now);
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const yest = new Date(nd);
    yest.setDate(nd.getDate() - 1);

    if (d.toDateString() === nd.toDateString()) return `last seen today at ${time}`;
    if (d.toDateString() === yest.toDateString())
        return `last seen yesterday at ${time}`;
    return `last seen ${d.toLocaleDateString()} at ${time}`;
}

export default function ChatRoomPage() {
    const { id } = useParams();
    const router = useRouter();

    const [peer, setPeer] = useState(null);
    const [me, setMe] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [error, setError] = useState(null);
    const [ready, setReady] = useState(false);
    const [nowTick, setNowTick] = useState(Date.now());
    const [showMore, setShowMore] = useState(false);

    const sinceRef = useRef(0); // 0 => first poll returns the whole history
    const seenRef = useRef(new Set());
    const clearedAtRef = useRef(null); // last known server clearedAt (ms)
    const bottomRef = useRef(null);

    useEffect(() => {
        let alive = true;

        const poll = async () => {
            try {
                const res = await fetch(`/api/talk/chat/${id}?since=${sinceRef.current}`);
                if (!alive) return;

                if (res.status === 401) {
                    router.replace('/quicktalk');
                    return;
                }
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    setError(body.error || 'Could not open this chat.');
                    setReady(true);
                    return;
                }

                const body = await res.json();
                setMe(body.me);
                setPeer(body.peer);
                setReady(true);

                // "Clear chat" pressed by either user -> wipe our view too.
                const serverCleared = body.clearedAt || 0;
                if (
                    clearedAtRef.current !== null &&
                    serverCleared > clearedAtRef.current
                ) {
                    seenRef.current.clear();
                    setMessages([]);
                    sinceRef.current = serverCleared;
                }
                clearedAtRef.current = serverCleared;

                const additions = [];
                for (const m of body.messages || []) {
                    if (seenRef.current.has(m.id)) continue;
                    seenRef.current.add(m.id);
                    sinceRef.current = Math.max(sinceRef.current, m.ts);
                    additions.push(m);
                }
                if (additions.length) {
                    setMessages((list) => [...list, ...additions]);
                }
            } catch {
                /* ignore transient network errors */
            }
        };

        poll();
        const t = setInterval(poll, 1500);
        return () => {
            alive = false;
            clearInterval(t);
        };
    }, [id, router]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Re-render the "last seen" line so "online" lapses to a timestamp on its own.
    useEffect(() => {
        const t = setInterval(() => setNowTick(Date.now()), 10_000);
        return () => clearInterval(t);
    }, []);

    const clearChat = async () => {
        setShowMore(false);
        seenRef.current.clear();
        setMessages([]);
        sinceRef.current = Date.now();
        await fetch(`/api/talk/chat/${id}/clear`, { method: 'POST' });
    };

    const send = async (e) => {
        e.preventDefault();
        const value = text.trim();
        if (!value) return;
        setText('');

        const res = await fetch(`/api/talk/chat/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: value }),
        });
        if (res.ok) {
            const { message } = await res.json();
            if (!seenRef.current.has(message.id)) {
                seenRef.current.add(message.id);
                setMessages((list) => [...list, message]);
                sinceRef.current = Math.max(sinceRef.current, message.ts);
            }
        }
    };

    if (ready && error) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-100 p-6 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <Link
                    href="/quicktalk/chat"
                    className="text-sm font-medium text-indigo-600 underline"
                >
                    Back
                </Link>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col bg-gray-100">
            {/* Header = connected user's name + last seen */}
            <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                    <Link
                        href="/quicktalk/chat"
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ←
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold leading-tight text-gray-900">
                            {peer?.username || '…'}
                        </h1>
                        {peer && (
                            <p
                                className={
                                    'text-xs leading-tight ' +
                                    (lastSeenText(peer.lastSeenAt, nowTick) === 'online'
                                        ? 'text-emerald-600'
                                        : 'text-gray-500')
                                }
                            >
                                {lastSeenText(peer.lastSeenAt, nowTick)}
                            </p>
                        )}
                    </div>
                </div>

                {/* More menu */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowMore((v) => !v)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        More
                    </button>

                    {showMore && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowMore(false)}
                            />
                            <div className="absolute right-0 z-50 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                                <button
                                    type="button"
                                    onClick={clearChat}
                                    className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                                >
                                    Clear chat
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.length === 0 && (
                    <p className="pt-8 text-center text-sm text-gray-400">
                        No messages yet. Say hello.
                    </p>
                )}
                {messages.map((m) => {
                    const mine = m.fromUserId === me;
                    return (
                        <div
                            key={m.id}
                            className={'flex ' + (mine ? 'justify-end' : 'justify-start')}
                        >
                            <div
                                className={
                                    'max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm ' +
                                    (mine
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-gray-800')
                                }
                            >
                                {!mine && (
                                    <div className="mb-0.5 text-xs font-semibold text-gray-500">
                                        {m.fromUsername}
                                    </div>
                                )}
                                {m.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <form
                onSubmit={send}
                className="flex gap-2 border-t border-gray-200 bg-white p-3"
            >
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                    Send
                </button>
            </form>
        </main>
    );
}
