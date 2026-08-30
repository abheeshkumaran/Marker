// In-memory, ephemeral chat buffer. Messages are NOT persisted to the database —
// they live only while the server process runs and are capped per connection.
// (On serverless this won't be shared across instances; fine for local/dev.)

const store = globalThis.__qtChatStore || (globalThis.__qtChatStore = new Map());
const MAX_PER_CONNECTION = 200;

export function addMessage(connectionId, message) {
    const arr = store.get(connectionId) || [];
    arr.push(message);
    if (arr.length > MAX_PER_CONNECTION) {
        arr.splice(0, arr.length - MAX_PER_CONNECTION);
    }
    store.set(connectionId, arr);
    return message;
}

export function getMessages(connectionId, since = 0) {
    const arr = store.get(connectionId) || [];
    return since ? arr.filter((m) => m.ts > since) : arr.slice();
}
