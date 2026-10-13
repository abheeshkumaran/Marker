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

    if (!superAdminCredentials) {
        return Response.json(
            { error: 'Super-admin credentials are not configured on the server.' },
            { status: 503 },
        );
    }

    const user = await User.findOne({ username: name }).select('+password username role');

    // No such user -> tell the client to offer registration.
    if (!user) {
        return Response.json(
            { code: 'no-account', message: 'No account for that username. Please register.' },
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

    if (user.role === 'superadmin') {
        return Response.json({ errors: { username: 'Use the configured super-admin ID.' } }, { status: 422 });
    }

    await setSessionCookie({
        uid: user._id.toString(),
        username: user.username,
        role: 'user',
    });
    return Response.json({ ok: true, username: user.username, role: 'user' });
}
