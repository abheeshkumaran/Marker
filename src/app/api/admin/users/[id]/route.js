export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

// DELETE /api/admin/users/:id — the row action button.
export async function DELETE(_request, { params }) {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return Response.json({ error: 'Invalid id.' }, { status: 400 });
    }

    await dbConnect();
    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
        return Response.json({ error: 'User not found.' }, { status: 404 });
    }

    return Response.json({ ok: true });
}
