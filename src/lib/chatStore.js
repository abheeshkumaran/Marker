// In-memory, ephemeral chat buffer. Messages are NOT persisted to the database —
// they live only while the server process runs and are capped per connection.
// Each connection also carries a shared "store" flag: when true, history is kept
// across refreshes for BOTH users; when false, each client only shows messages
// received since its own page load.
// (On serverless this won't be shared across instances; fine for local/dev.)

const g =
    globalThis.__qtChat ||
    (globalThis.__qtChat = { messages: new Map(), store: new Map() });

const MAX_PER_CONNECTION = 500;

export function addMessage(connectionId, message) {
    const arr = g.messages.get(connectionId) || [];
    arr.push(message);
    if (arr.length > MAX_PER_CONNECTION) {
        arr.splice(0, arr.length - MAX_PER_CONNECTION);
    }
    g.messages.set(connectionId, arr);
    return message;
}

export function getMessages(connectionId, since = 0) {
    const arr = g.messages.get(connectionId) || [];
    return since ? arr.filter((m) => m.ts > since) : arr.slice();
}

export function clearMessages(connectionId) {
    g.messages.delete(connectionId);
}

export function getStore(connectionId) {
    return g.store.get(connectionId) === true;
}

export function setStore(connectionId, value) {
    const next = value === true;
    g.store.set(connectionId, next);
    // Turning storage OFF wipes the shared history for both users.
    if (!next) clearMessages(connectionId);
    return next;
}
