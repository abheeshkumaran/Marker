export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import crypto from 'crypto';
import User from '@/models/User';
import ChatMessage from '@/models/ChatMessage';
import { getSession } from '@/lib/session';
import { authorizeConnection } from '@/lib/chatAuth';
import { getClearedAt } from '@/lib/conversation';

// GET /api/talk/chat/:id?since=<ms>
// Chat is always persisted; a refresh never clears it. Only an explicit
// "Clear chat" wipes it (for both users).
export async function GET(request, { params }) {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Not signed in.' }, { status: 401 });

    const { id } = await params;
    const auth = await authorizeConnection(id, session);
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

    // Heartbeat: mark the current user active (drives the peer's "last seen").
    await User.updateOne({ _id: session.uid }, { $set: { lastSeenAt: new Date() } });

    const peer = await User.findById(auth.otherId)
        .select('username lastSeenAt')
        .lean();
    const since = Number(new URL(request.url).searchParams.get('since')) || 0;

    const docs = await ChatMessage.find({
        connectionId: id,
        ...(since ? { ts: { $gt: since } } : {}),
    })
        .sort({ ts: 1 })
        .lean();

    return Response.json({
        me: session.uid,
        peer: peer
            ? {
                  id: String(peer._id),
                  username: peer.username,
                  lastSeenAt: peer.lastSeenAt || null,
              }
            : null,
        clearedAt: await getClearedAt(id),
        messages: docs.map((d) => ({
            id: d.mid,
            fromUserId: d.fromUserId,
            fromUsername: d.fromUsername,
            text: d.text,
            ts: d.ts,
        })),
    });
}

// POST /api/talk/chat/:id  { text }
export async function POST(request, { params }) {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Not signed in.' }, { status: 401 });

    const { id } = await params;
    const auth = await authorizeConnection(id, session);
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

    await User.updateOne({ _id: session.uid }, { $set: { lastSeenAt: new Date() } });

    const { text } = await request.json().catch(() => ({}));
    const value = String(text || '').trim();
    if (!value) return Response.json({ error: 'Message is empty.' }, { status: 422 });

    const message = {
        id: crypto.randomUUID(),
        fromUserId: session.uid,
        fromUsername: session.username,
        text: value.slice(0, 2000),
        ts: Date.now(),
    };

    await ChatMessage.create({
        connectionId: id,
        mid: message.id,
        fromUserId: message.fromUserId,
        fromUsername: message.fromUsername,
        text: message.text,
        ts: message.ts,
    });

    return Response.json({ ok: true, message }, { status: 201 });
}
