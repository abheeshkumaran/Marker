export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { getSuperAdminCredentials } from '@/lib/superAdmin';

// GET /api/health — shows whether the server is configured and connected to the database.
// Reports only yes/no flags and counts, never secret values.
export async function GET() {
    const env = {
        MONGODB_URI: Boolean(process.env.MONGODB_URI),
        SESSION_SECRET: Boolean(process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET),
        SUPER_ADMIN_USERNAME: Boolean(process.env.SUPER_ADMIN_USERNAME),
        SUPER_ADMIN_PASSWORD: Boolean(process.env.SUPER_ADMIN_PASSWORD),
    };

    try {
        const connection = await dbConnect();
        const superAdmin = getSuperAdminCredentials();
        const [users, superAdminExists] = await Promise.all([
            User.countDocuments(),
            superAdmin ? User.exists({ username: superAdmin.username }) : null,
        ]);
        return Response.json({
            ok: Object.values(env).every(Boolean),
            env,
            database: { connected: true, name: connection.name, users },
            superAdminAccount: superAdmin ? Boolean(superAdminExists) : 'SUPER_ADMIN_* not set',
        });
    } catch (error) {
        return Response.json(
            {
                ok: false,
                env,
                database: { connected: false, error: error?.message || 'Connection failed.' },
            },
            { status: 503 },
        );
    }
}
