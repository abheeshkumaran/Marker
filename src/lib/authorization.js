import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { verifySession } from '@/lib/session';

export async function getAuthenticatedUser(request) {
    const token = request
        ? request.cookies.get('qt_session')?.value
        : (await cookies()).get('qt_session')?.value;
    const session = verifySession(token);
    if (!session?.uid) return null;

    await dbConnect();
    return User.findById(session.uid).select('_id username role').lean();
}

export function unauthorizedResponse() {
    return Response.json({ error: 'Sign in to continue.' }, { status: 401 });
}

export function forbiddenResponse() {
    return Response.json({ error: 'You are not authorized to access this resource.' }, { status: 403 });
}

export async function getSuperAdmin(request) {
    const user = await getAuthenticatedUser(request);
    return user?.role === 'superadmin' ? user : null;
}
