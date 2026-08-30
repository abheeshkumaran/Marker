export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/mongoose';
import Activity from '@/models/Activity';
import { getSession } from '@/lib/session';

// GET /api/talk/activity — only the logged-in user's own rows.
export async function GET() {
    const session = await getSession();
    if (!session) {
        return Response.json({ error: 'Not signed in.' }, { status: 401 });
    }

    await dbConnect();
    const items = await Activity.find({ userId: session.uid })
        .sort({ createdAt: -1 })
        .lean();

    return Response.json({
        items: items.map((i) => ({
            id: String(i._id),
            text: i.text,
            createdAt: i.createdAt,
        })),
    });
}

// POST /api/talk/activity — add a row owned by the logged-in user.
export async function POST(request) {
    const session = await getSession();
    if (!session) {
        return Response.json({ error: 'Not signed in.' }, { status: 401 });
    }

    const { text } = await request.json().catch(() => ({}));
    const value = String(text || '').trim();
    if (!value) {
        return Response.json({ error: 'Text is required.' }, { status: 422 });
    }

    await dbConnect();
    const doc = await Activity.create({ userId: session.uid, text: value.slice(0, 500) });

    return Response.json(
        { item: { id: String(doc._id), text: doc.text, createdAt: doc.createdAt } },
        { status: 201 },
    );
}
