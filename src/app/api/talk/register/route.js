export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { setSessionCookie } from '@/lib/session';
import { generateUniqueConnectingCode } from '@/lib/connectingCode';

export async function POST(request) {
    const { username, password } = await request.json().catch(() => ({}));

    const name = String(username || '').trim();
    const pass = String(password || '');

    const errors = {};
    if (!name) errors.username = 'Username is required.';
    if (!pass) errors.password = 'Password is required.';
    else if (pass.length < 4) errors.password = 'Password must be at least 4 characters.';

    if (Object.keys(errors).length) {
        return Response.json({ errors }, { status: 422 });
    }

    await dbConnect();

    const exists = await User.findOne({ username: name });
    if (exists) {
        return Response.json(
            { errors: { username: 'User already exists.' } },
            { status: 422 },
        );
    }

    const passwordHash = await bcrypt.hash(pass, 10);

    let user;
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            user = await User.create({
                username: name,
                password: passwordHash,
                connectingCode: await generateUniqueConnectingCode(User),
            });
            break;
        } catch (err) {
            // Retry only if the connecting code lost a race; rethrow anything else.
            if (err?.code === 11000 && err?.keyPattern?.connectingCode) continue;
            if (err?.code === 11000 && err?.keyPattern?.username) {
                return Response.json(
                    { errors: { username: 'User already exists.' } },
                    { status: 422 },
                );
            }
            throw err;
        }
    }

    if (!user) {
        return Response.json(
            { message: 'Could not create the account. Please try again.' },
            { status: 500 },
        );
    }

    await setSessionCookie({ uid: user._id.toString(), username: user.username });

    return Response.json(
        { ok: true, username: user.username, connectingCode: user.connectingCode },
        { status: 201 },
    );
}
