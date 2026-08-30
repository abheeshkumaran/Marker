export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getSession } from '@/lib/session';
import { authorizeConnection } from '@/lib/chatAuth';
import { getStore, setStore } from '@/lib/chatStore';

// POST /api/talk/chat/:id/store  { store: boolean }
// Shared per-connection flag. Turning it off clears history for both users.
export async function POST(request, { params }) {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Not signed in.' }, { status: 401 });

    const { id } = await params;
    const auth = await authorizeConnection(id, session);
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

    const { store } = await request.json().catch(() => ({}));
    const next = setStore(id, store === true);

    return Response.json({ ok: true, store: next });
}

// GET /api/talk/chat/:id/store — read the flag.
export async function GET(_request, { params }) {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Not signed in.' }, { status: 401 });

    const { id } = await params;
    const auth = await authorizeConnection(id, session);
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

    return Response.json({ store: getStore(id) });
}
