export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import ConnectionRequest from '@/models/ConnectionRequest';
import { getSession } from '@/lib/session';

// GET /api/talk/lookup?code=XXXXXXXX — find a user by their connecting code,
// plus the request status between them and the current user.
export async function GET(request) {
    const session = await getSession();
    if (!session) {
        return Response.json({ error: 'Not signed in.' }, { status: 401 });
    }

    const code = (new URL(request.url).searchParams.get('code') || '').trim();
    if (!code) {
        return Response.json({ error: 'Connecting code is required.' }, { status: 422 });
    }

    await dbConnect();
    const user = await User.findOne({ connectingCode: code })
        .select('username')
        .lean();

    if (!user) {
        return Response.json({ found: false }, { status: 404 });
    }

    const isSelf = String(user._id) === session.uid;

    // requestStatus: null | 'sent' | 'received' | 'connected'
    let requestStatus = null;
    if (!isSelf) {
        const rel = await ConnectionRequest.findOne({
            $or: [
                { fromUserId: session.uid, toUserId: user._id },
                { fromUserId: user._id, toUserId: session.uid },
            ],
        })
            .sort({ updatedAt: -1 })
            .lean();

        if (rel) {
            if (rel.status === 'accepted') requestStatus = 'connected';
            else if (rel.status === 'pending') {
                requestStatus =
                    String(rel.fromUserId) === session.uid ? 'sent' : 'received';
            }
            // 'rejected' rows are deleted on reject, so this is effectively null
        }
    }

    return Response.json({
        found: true,
        user: {
            id: String(user._id),
            username: user.username,
            isSelf,
            requestStatus,
        },
    });
}
