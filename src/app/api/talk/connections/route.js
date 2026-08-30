export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/mongoose';
import ConnectionRequest from '@/models/ConnectionRequest';
import { getSession } from '@/lib/session';
import { makeConnectionId } from '@/lib/connectionId';

// GET /api/talk/connections — accepted connections for the current user.
export async function GET() {
    const session = await getSession();
    if (!session) {
        return Response.json({ error: 'Not signed in.' }, { status: 401 });
    }

    await dbConnect();

    const accepted = await ConnectionRequest.find({
        status: 'accepted',
        $or: [{ fromUserId: session.uid }, { toUserId: session.uid }],
    })
        .populate('fromUserId', 'username')
        .populate('toUserId', 'username')
        .lean();

    const byConn = new Map();
    for (const r of accepted) {
        const from = r.fromUserId;
        const to = r.toUserId;
        if (!from || !to) continue;
        const other = String(from._id) === session.uid ? to : from;
        const connectionId = makeConnectionId(session.uid, other._id);
        if (!byConn.has(connectionId)) {
            byConn.set(connectionId, {
                connectionId,
                user: { id: String(other._id), username: other.username },
            });
        }
    }

    return Response.json({ connections: [...byConn.values()] });
}
