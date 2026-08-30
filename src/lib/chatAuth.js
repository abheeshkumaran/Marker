import dbConnect from '@/lib/mongoose';
import ConnectionRequest from '@/models/ConnectionRequest';
import { parseConnectionId } from '@/lib/connectionId';

/**
 * Verify the session user belongs to the connection `id` and that the two
 * users have an accepted connection. Returns `{ otherId }` or `{ error, status }`.
 */
export async function authorizeConnection(id, session) {
    const pair = parseConnectionId(id);
    if (!pair) return { error: 'Invalid connection id.', status: 400 };
    if (!pair.includes(session.uid)) return { error: 'Forbidden.', status: 403 };

    await dbConnect();
    const link = await ConnectionRequest.findOne({
        status: 'accepted',
        $or: [
            { fromUserId: pair[0], toUserId: pair[1] },
            { fromUserId: pair[1], toUserId: pair[0] },
        ],
    }).lean();
    if (!link) return { error: 'You are not connected with this user.', status: 403 };

    return { otherId: pair.find((p) => p !== session.uid) };
}
