export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { clearSessionCookie } from '@/lib/session';

// POST /api/talk/logout
export async function POST() {
    await clearSessionCookie();
    return Response.json({ ok: true });
}
