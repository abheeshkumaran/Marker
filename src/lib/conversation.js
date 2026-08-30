import Conversation from '@/models/Conversation';

// When the chat was last cleared (ms epoch), or 0 if never.
export async function getClearedAt(connectionId) {
    const c = await Conversation.findOne({ connectionId }).lean();
    return c?.clearedAt ? new Date(c.clearedAt).getTime() : 0;
}

// Mark the chat cleared right now; returns the timestamp used.
export async function markCleared(connectionId) {
    const now = new Date();
    await Conversation.updateOne(
        { connectionId },
        { $set: { clearedAt: now } },
        { upsert: true },
    );
    return now.getTime();
}
