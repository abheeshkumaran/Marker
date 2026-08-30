export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import ConnectionRequest from '@/models/ConnectionRequest';
import { getSession } from '@/lib/session';

// GET /api/talk/requests — this user's incoming + sent requests.
export async function GET() {
    const session = await getSession();
    if (!session) {
        return Response.json({ error: 'Not signed in.' }, { status: 401 });
    }

    await dbConnect();

    const [incoming, sent] = await Promise.all([
        ConnectionRequest.find({ toUserId: session.uid, status: 'pending' })
            .sort({ createdAt: -1 })
            .populate('fromUserId', 'username')
            .lean(),
        ConnectionRequest.find({ fromUserId: session.uid })
            .sort({ createdAt: -1 })
            .populate('toUserId', 'username')
            .lean(),
    ]);

    return Response.json({
        pendingCount: incoming.length,
        incoming: incoming.map((r) => ({
            id: String(r._id),
            username: r.fromUserId?.username || '(deleted user)',
            createdAt: r.createdAt,
        })),
        sent: sent.map((r) => ({
            id: String(r._id),
            username: r.toUserId?.username || '(deleted user)',
            status: r.status,
            createdAt: r.createdAt,
        })),
    });
}

// POST /api/talk/requests  { code }  — send a request to the user with that connecting code.
export async function POST(request) {
    const session = await getSession();
    if (!session) {
        return Response.json({ error: 'Not signed in.' }, { status: 401 });
    }

    const { code } = await request.json().catch(() => ({}));
    const value = String(code || '').trim();
    if (!value) {
        return Response.json({ error: 'Connecting code is required.' }, { status: 422 });
    }

    await dbConnect();

    const target = await User.findOne({ connectingCode: value }).select('_id').lean();
    if (!target) {
        return Response.json({ error: 'No user has that connecting code.' }, { status: 404 });
    }
    if (String(target._id) === session.uid) {
        return Response.json({ error: "You can't send a request to yourself." }, { status: 422 });
    }

    const existing = await ConnectionRequest.findOne({
        $or: [
            { fromUserId: session.uid, toUserId: target._id },
            { fromUserId: target._id, toUserId: session.uid },
        ],
        status: 'pending',
    }).lean();

    if (existing) {
        const mine = String(existing.fromUserId) === session.uid;
        return Response.json(
            {
                error: mine
                    ? 'You already sent this person a request.'
                    : 'This person already sent you a request — check your requests.',
            },
            { status: 409 },
        );
    }

    await ConnectionRequest.create({
        fromUserId: session.uid,
        toUserId: target._id,
        status: 'pending',
    });

    return Response.json({ ok: true }, { status: 201 });
}
