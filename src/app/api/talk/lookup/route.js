export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { getSession } from '@/lib/session';

// GET /api/talk/lookup?code=XXXXXXXX — find a user by their connecting code.
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

    return Response.json({
        found: true,
        user: {
            id: String(user._id),
            username: user.username,
            isSelf: String(user._id) === session.uid,
        },
    });
}
