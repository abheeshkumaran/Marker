export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { generateUniqueConnectingCode } from '@/lib/connectingCode';
import { getSuperAdmin } from '@/lib/authorization';
import { serializeAdminUser, validateUserInput } from '@/lib/adminUsers';

function forbidden() {
    return Response.json({ error: 'Super-admin access is required.' }, { status: 403 });
}

// GET /api/admin/users — list every account for the admin panel.
export async function GET(request) {
    if (!(await getSuperAdmin(request))) return forbidden();

    await dbConnect();

    // Backfill any user created before connecting codes existed.
    const missing = await User.find({
        role: 'user',
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

    const users = await User.find({}, 'username role connectingCode createdAt updatedAt')
        .sort({ role: -1, createdAt: -1 })
        .lean();

    return Response.json({ users: users.map(serializeAdminUser) });
}

// POST /api/admin/users  { username, password, role }
export async function POST(request) {
    if (!(await getSuperAdmin(request))) return forbidden();

    const data = await request.json().catch(() => ({}));
    const { username, password, role, errors } = validateUserInput(data);
    if (Object.keys(errors).length) return Response.json({ errors }, { status: 422 });

    await dbConnect();
    if (await User.exists({ username })) {
        return Response.json({ errors: { username: 'That username is already taken.' } }, { status: 422 });
    }

    try {
        const user = await User.create({
            username,
            password: await bcrypt.hash(password, 10),
            role,
            connectingCode: role === 'user' ? await generateUniqueConnectingCode(User) : undefined,
        });
        return Response.json({ user: serializeAdminUser(user) }, { status: 201 });
    } catch (error) {
        if (error?.code === 11000) {
            return Response.json({ errors: { username: 'That username is already taken.' } }, { status: 422 });
        }
        throw error;
    }
}
