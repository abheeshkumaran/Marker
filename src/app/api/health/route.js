import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';

export const dynamic = 'force-dynamic';

// GET /api/health — verifies the MongoDB connection.
export async function GET() {
    try {
        await dbConnect();
        const state = mongoose.connection.readyState; // 1 = connected
        return Response.json({
            ok: state === 1,
            db: mongoose.connection.name,
            state,
        });
    } catch (err) {
        return Response.json({ ok: false, error: err.message }, { status: 500 });
    }
}
