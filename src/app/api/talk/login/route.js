export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { setSessionCookie } from '@/lib/session';

export async function POST(request) {
    const { username, password } = await request.json().catch(() => ({}));

    const name = String(username || '').trim();
    const pass = String(password || '');

    if (!name) {
        return Response.json(
            { errors: { username: 'Username is required.' } },
            { status: 422 },
        );
    }

    await dbConnect();

    const user = await User.findOne({ username: name }).select('+password');

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

    await setSessionCookie({ uid: user._id.toString(), username: user.username });

    return Response.json({ ok: true, username: user.username });
}
