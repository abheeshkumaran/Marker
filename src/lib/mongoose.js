import dns from 'dns';
import mongoose from 'mongoose';

// NOTE: do not throw at module load — that breaks `next build` (page-data
// collection imports route modules). Only fail when a connection is actually
// requested at runtime.

// Some machines (VPN clients, local DNS proxies) leave Node's resolver pointed
// at 127.0.0.1 with nothing listening, so DNS lookups fail with ECONNREFUSED.
// If the resolver list is loopback-only, switch to public DNS. Harmless on
// Vercel / normal networks.
function ensureUsableDns() {
    try {
        const servers = dns.getServers();
        const loopbackOnly =
            servers.length === 0 ||
            servers.every((s) => s === '127.0.0.1' || s === '::1');
        if (!loopbackOnly) return;

        const publicDns = (process.env.DNS_SERVERS || '1.1.1.1,8.8.8.8')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        dns.setServers(publicDns);
    } catch {
        // ignore — let the driver surface any real problem
    }
}

// Reuse a single connection across hot reloads (dev) and serverless
// invocations (Vercel).
let cached = global._mongoose;

if (!cached) {
    cached = global._mongoose = { promise: null };
}

export default async function dbConnect() {
    // 1 = connected, 2 = connecting — reuse those.
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!cached.promise) {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error(
                'MONGODB_URI is not set. Add it to .env locally and to the Vercel project env vars.',
            );
        }

        ensureUsableDns();
        cached.promise = mongoose
            .connect(uri, {
                bufferCommands: false,
                serverSelectionTimeoutMS: 10000,
            })
            .then((m) => m.connection);
    }

    try {
        return await cached.promise;
    } catch (err) {
        cached.promise = null; // allow a retry on the next request
        throw err;
    }
}
