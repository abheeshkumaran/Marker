export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

// GET /api/talk/me — the logged-in user (from DB), including their connecting code.
export async function GET() {
    const store = await cookies();
    const session = verifySession(store.get('qt_session')?.value);
    if (!session) {
        return Response.json({ user: null }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.uid)
        .select('username connectingCode role')
        .lean();

    if (!user) {
        return Response.json({ user: null }, { status: 401 });
    }

    return Response.json({
        user: {
            id: String(user._id),
            username: user.username,
            role: user.role || 'user',
            connectingCode: user.connectingCode || null,
        },
    });
}
