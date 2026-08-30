export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getSession } from '@/lib/session';

// GET /api/talk/me — who is logged in on this browser.
export async function GET() {
    const session = await getSession();
    if (!session) {
        return Response.json({ user: null }, { status: 401 });
    }
    return Response.json({ user: { id: session.uid, username: session.username } });
}
