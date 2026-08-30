import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE = 'qt_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const SECRET =
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'dev-insecure-secret-change-me';

function b64url(buf) {
    return Buffer.from(buf).toString('base64url');
}

function sign(data) {
    return crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
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
    return verifySession(store.get(COOKIE)?.value);
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
