export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { generateUniqueConnectingCode } from '@/lib/connectingCode';

// GET /api/admin/users — list users for the admin panel.
export async function GET() {
    await dbConnect();

    // Backfill any user created before connecting codes existed.
    const missing = await User.find({
        $or: [{ connectingCode: { $exists: false } }, { connectingCode: null }],
    }).select('_id');

    for (const doc of missing) {
        try {
            await User.updateOne(
                { _id: doc._id },
                { $set: { connectingCode: await generateUniqueConnectingCode(User) } },
            );
        } catch {
            // ignore a transient race; it'll be retried on the next load
        }
    }

    const users = await User.find({}, 'username connectingCode createdAt')
        .sort({ createdAt: -1 })
        .lean();

    return Response.json({
        users: users.map((u) => ({
            id: String(u._id),
            username: u.username,
            connectingCode: u.connectingCode || null,
            createdAt: u.createdAt,
        })),
    });
}
