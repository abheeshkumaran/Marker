import crypto from 'crypto';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

const COOKIE = 'qt_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
    const secret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error('SESSION_SECRET must be configured to sign user sessions.');
    return secret;
}

function b64url(buf) {
    return Buffer.from(buf).toString('base64url');
}

function sign(data) {
    return crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
}

/** Create a signed token for a payload object. */
export function signSession(payload) {
    const body = b64url(JSON.stringify({ ...payload, iat: Date.now() }));
    return `${body}.${sign(body)}`;
}

/** Verify a token; returns the payload or null. */
export function verifySession(token) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [body, sig] = token.split('.');
    const expected = sign(body);
    // constant-time compare
    if (
        sig.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
        return null;
    }
    try {
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
        if (Date.now() - payload.iat > MAX_AGE * 1000) return null;
        return payload;
    } catch {
        return null;
    }
}

/** Read the current session payload from the request cookie, or null. */
export async function getSession() {
    const store = await cookies();
    const session = verifySession(store.get(COOKIE)?.value);
    if (!session || session.role === 'superadmin') return null;
    if (!session.role && session.uid) {
        await dbConnect();
        const user = await User.findById(session.uid).select('role').lean();
        if (user?.role === 'superadmin') return null;
    }
    return session;
}

/** Set the session cookie (call inside a route handler / server action). */
export async function setSessionCookie(payload) {
    const store = await cookies();
    store.set(COOKIE, signSession(payload), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: MAX_AGE,
    });
}

/** Clear the session cookie. */
export async function clearSessionCookie() {
    const store = await cookies();
    store.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}
