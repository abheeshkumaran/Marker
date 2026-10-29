export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/mongoose';
import Expense from '@/models/Expense';
import ExpenseCategory from '@/models/ExpenseCategory';
import { getAuthenticatedUser, forbiddenResponse, unauthorizedResponse } from '@/lib/authorization';
import { resolveOption } from '@/lib/namedOptions';

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
    const amount = Number(data.amount);

    await dbConnect();
    const category = await resolveOption(
        ExpenseCategory,
        user._id,
        data.categoryId,
        data.otherPurpose,
        'expense',
    );

    const errors = {};
    if (!date || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateString) {
        errors.date = 'A valid expense date is required.';
    }
    if (category.error) errors.purpose = category.error;
    if (
        (typeof data.amount !== 'string' && typeof data.amount !== 'number') ||
        data.amount === '' ||
        !Number.isFinite(amount) ||
        amount < 0
    ) {
        errors.amount = 'Enter a valid expense amount.';
    }

    if (Object.keys(errors).length) {
        return Response.json({ errors }, { status: 422 });
    }

    try {
        const created = await Expense.create({
            userId: user._id,
            date,
            purpose: category.name,
            categoryId: category.refId,
            isOther: category.isOther,
            amount,
        });
        return Response.json(
            {
                expense: {
                    id: String(created._id),
                    date: created.date,
                    purpose: created.purpose,
                    isOther: created.isOther,
                    amount: created.amount,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('Failed to save expense:', error);
        return Response.json({ error: 'Unable to save expense. Please try again.' }, { status: 500 });
    }
}
