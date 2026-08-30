export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import crypto from 'crypto';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import ConnectionRequest from '@/models/ConnectionRequest';
import { getSession } from '@/lib/session';
import { parseConnectionId } from '@/lib/connectionId';
import { addMessage, getMessages } from '@/lib/chatStore';

async function authorize(id, session) {
    const pair = parseConnectionId(id);
    if (!pair) return { error: 'Invalid connection id.', status: 400 };
    if (!pair.includes(session.uid)) return { error: 'Forbidden.', status: 403 };

    await dbConnect();
    const link = await ConnectionRequest.findOne({
        status: 'accepted',
        $or: [
            { fromUserId: pair[0], toUserId: pair[1] },
            { fromUserId: pair[1], toUserId: pair[0] },
        ],
    }).lean();
    if (!link) return { error: 'You are not connected with this user.', status: 403 };

    const otherId = pair.find((p) => p !== session.uid);
    return { otherId };
}

// GET /api/talk/chat/:id?since=<ms> — peer info + messages newer than `since`.
export async function GET(request, { params }) {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Not signed in.' }, { status: 401 });

    const { id } = await params;
    const auth = await authorize(id, session);
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

    const peer = await User.findById(auth.otherId).select('username').lean();
    const since = Number(new URL(request.url).searchParams.get('since')) || 0;

    return Response.json({
        me: session.uid,
        peer: peer ? { id: String(peer._id), username: peer.username } : null,
        messages: getMessages(id, since),
    });
}

// POST /api/talk/chat/:id  { text }  — send a message.
export async function POST(request, { params }) {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Not signed in.' }, { status: 401 });

    const { id } = await params;
    const auth = await authorize(id, session);
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

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
    addMessage(id, message);

    return Response.json({ ok: true, message }, { status: 201 });
}
