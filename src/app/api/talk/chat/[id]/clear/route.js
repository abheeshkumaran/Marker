export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import ChatMessage from '@/models/ChatMessage';
import { getSession } from '@/lib/session';
import { authorizeConnection } from '@/lib/chatAuth';
import { markCleared } from '@/lib/conversation';

// POST /api/talk/chat/:id/clear — delete all messages for this connection.
// Both clients wipe their view on the next poll (via the returned clearedAt).
export async function POST(_request, { params }) {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Not signed in.' }, { status: 401 });

    const { id } = await params;
    const auth = await authorizeConnection(id, session);
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

    await ChatMessage.deleteMany({ connectionId: id });
    const clearedAt = await markCleared(id);

    return Response.json({ ok: true, clearedAt });
}
