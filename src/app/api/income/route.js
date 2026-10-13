export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/mongoose';
import Income from '@/models/Income';
import { getAuthenticatedUser, forbiddenResponse, unauthorizedResponse } from '@/lib/authorization';

const validSources = new Set(['salary', 'business', 'investment', 'other']);

export async function POST(request) {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedResponse();
    if (user.role === 'superadmin') return forbiddenResponse();

    let data;
    try {
        data = await request.json();
    } catch {
        return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return Response.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
    }

    const dateString = typeof data.date === 'string' ? data.date : '';
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
        ? new Date(`${dateString}T00:00:00.000Z`)
        : null;
    const source = typeof data.source === 'string' ? data.source.trim() : '';
    const amount = Number(data.amount);

    const errors = {};
    if (!date || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateString) {
        errors.date = 'A valid income date is required.';
    }
    if (!validSources.has(source)) errors.source = 'Select a valid income source.';
    if (
        (typeof data.amount !== 'string' && typeof data.amount !== 'number') ||
        data.amount === '' ||
        !Number.isFinite(amount) ||
        amount < 0
    ) {
        errors.amount = 'Enter a valid income amount.';
    }

    if (Object.keys(errors).length) {
        return Response.json({ errors }, { status: 422 });
    }

    try {
        await dbConnect();
        const created = await Income.create({ userId: user._id, date, source, amount });
        return Response.json(
            {
                income: {
                    id: String(created._id),
                    date: created.date,
                    source: created.source,
                    amount: created.amount,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('Failed to save income:', error);
        return Response.json({ error: 'Unable to save income. Please try again.' }, { status: 500 });
    }
}
