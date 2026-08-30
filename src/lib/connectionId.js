// A connection id is the two user ids, sorted, joined by "_".

export function makeConnectionId(a, b) {
    return [String(a), String(b)].sort().join('_');
}

export function parseConnectionId(id) {
    const parts = String(id || '').split('_');
    if (parts.length !== 2 || !parts.every((p) => /^[a-f0-9]{24}$/.test(p))) {
        return null;
    }
    return parts;
}
