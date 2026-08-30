'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function ChatRoomPage() {
    const { id } = useParams();
    const router = useRouter();

    const [peer, setPeer] = useState(null);
    const [me, setMe] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [error, setError] = useState(null);
    const [ready, setReady] = useState(false);

    // Start "empty" on every load — a refresh clears THIS client's view only.
    const sinceRef = useRef(Date.now());
    const seenRef = useRef(new Set());
    const bottomRef = useRef(null);

    useEffect(() => {
        let alive = true;

        const poll = async () => {
            try {
                const res = await fetch(
                    `/api/talk/chat/${id}?since=${sinceRef.current}`,
                );
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

                if (body.messages?.length) {
                    const fresh = body.messages.filter(
                        (m) => !seenRef.current.has(m.id),
                    );
                    fresh.forEach((m) => seenRef.current.add(m.id));
                    if (fresh.length) {
                        setMessages((list) => [...list, ...fresh]);
                        sinceRef.current = Math.max(
                            sinceRef.current,
                            ...fresh.map((m) => m.ts),
                        );
                    }
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
            {/* Header = connected user's name */}
            <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
                <Link href="/quicktalk/chat" className="text-gray-400 hover:text-gray-600">
                    ←
                </Link>
                <h1 className="text-lg font-bold text-gray-900">
                    {peer?.username || '…'}
                </h1>
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
