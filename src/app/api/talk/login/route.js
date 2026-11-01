export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { setSessionCookie } from '@/lib/session';
import { ensureSuperAdmin, getSuperAdminCredentials } from '@/lib/superAdmin';

export async function POST(request) {
    const { username, password } = await request.json().catch(() => ({}));

    const name = String(username || '').trim().toLowerCase();
    const pass = String(password || '');

    if (!name) {
        return Response.json(
            { errors: { username: 'Username is required.' } },
            { status: 422 },
        );
    }
    if (!pass) {
        return Response.json(
            { errors: { password: 'Password is required.' } },
            { status: 422 },
        );
    }

    const superAdminCredentials = getSuperAdminCredentials();
    await dbConnect();
    if (superAdminCredentials && name === superAdminCredentials.username) {
        const superAdmin = await ensureSuperAdmin();
        const ok = await bcrypt.compare(pass, superAdmin.password);
        if (!ok) {
            return Response.json({ errors: { password: 'Incorrect password.' } }, { status: 422 });
        }
        await setSessionCookie({
            uid: superAdmin._id.toString(),
            username: superAdmin.username,
            role: 'superadmin',
        });
        return Response.json({
            ok: true,
            username: superAdmin.username,
            role: 'superadmin',
        });
    }

    // Accounts are checked against the database, so login still works when the
    // SUPER_ADMIN_* env vars are missing (they are only needed to create the super-admin).
    const user = await User.findOne({ username: name }).select('+password username role');

    // No such user -> tell the client to offer registration.
    if (!user) {
        return Response.json(
            { code: 'no-account', message: 'No account for that username.' },
            { status: 404 },
        );
    }

    if (!pass) {
        return Response.json(
            { errors: { password: 'Password is required.' } },
            { status: 422 },
        );
    }

    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) {
        return Response.json(
            { errors: { password: 'Incorrect password.' } },
            { status: 422 },
        );
    }

    const role = user.role === 'superadmin' ? 'superadmin' : 'user';
    await setSessionCookie({
        uid: user._id.toString(),
        username: user.username,
        role,
    });
    return Response.json({ ok: true, username: user.username, role });
}
