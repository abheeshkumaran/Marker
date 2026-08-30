export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import ConnectionRequest from '@/models/ConnectionRequest';
import { getSession } from '@/lib/session';

// POST /api/talk/requests/:id  { action: 'accept' | 'reject' }
export async function POST(request, { params }) {
    const session = await getSession();
    if (!session) {
        return Response.json({ error: 'Not signed in.' }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return Response.json({ error: 'Invalid request id.' }, { status: 400 });
    }

    const { action } = await request.json().catch(() => ({}));
    if (action !== 'accept' && action !== 'reject') {
        return Response.json({ error: 'action must be "accept" or "reject".' }, { status: 422 });
    }

    await dbConnect();

    // Only the recipient can act on a pending request.
    const reqDoc = await ConnectionRequest.findOne({
        _id: id,
        toUserId: session.uid,
        status: 'pending',
    });

    if (!reqDoc) {
        return Response.json({ error: 'Request not found.' }, { status: 404 });
    }

    if (action === 'reject') {
        await reqDoc.deleteOne(); // remove from the table
        return Response.json({ ok: true, action: 'rejected' });
    }

    reqDoc.status = 'accepted';
    await reqDoc.save();
    return Response.json({ ok: true, action: 'accepted' });
}
