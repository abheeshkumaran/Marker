export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/mongoose';
import Expense from '@/models/Expense';
import Income from '@/models/Income';
import { getAuthenticatedUser, forbiddenResponse, unauthorizedResponse } from '@/lib/authorization';

export async function GET(request) {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedResponse();
    if (user.role === 'superadmin') return forbiddenResponse();

    try {
        await dbConnect();
        const [openingBalance, incomeTotals, expenseTotals] = await Promise.all([
            Income.findOne({ userId: user._id, source: 'opening_balance' }).lean(),
            Income.aggregate([
                { $match: { userId: user._id } },
                { $group: { _id: null, amount: { $sum: '$amount' } } },
            ]),
            Expense.aggregate([
                { $match: { userId: user._id } },
                { $group: { _id: null, amount: { $sum: '$amount' } } },
            ]),
        ]);

        const totalIncome = incomeTotals[0]?.amount || 0;
        const totalExpenses = expenseTotals[0]?.amount || 0;
        return Response.json({
            hasOpeningBalance: Boolean(openingBalance),
            openingBalance: openingBalance
                ? {
                      id: String(openingBalance._id),
                      amount: openingBalance.amount,
                      date: openingBalance.date,
                  }
                : null,
            currentBalance: totalIncome - totalExpenses,
        });
    } catch (error) {
        console.error('Failed to load current balance:', error);
        return Response.json(
            { error: 'Unable to load current balance. Please try again.' },
            { status: 500 },
        );
    }
}

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

    const amount = Number(data.amount);
    if (
        (typeof data.amount !== 'string' && typeof data.amount !== 'number') ||
        data.amount === '' ||
        !Number.isFinite(amount) ||
        amount < 0
    ) {
        return Response.json(
            { errors: { amount: 'Enter a valid current balance.' } },
            { status: 422 },
        );
    }

    try {
        await dbConnect();
        const existingBalance = await Income.exists({
            userId: user._id,
            source: 'opening_balance',
        });
        if (existingBalance) {
            return Response.json(
                { error: 'A starting balance has already been set. Reset financial data to start over.' },
                { status: 409 },
            );
        }

        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);
        const created = await Income.create({
            userId: user._id,
            date,
            source: 'opening_balance',
            amount,
        });
        return Response.json(
            {
                openingBalance: {
                    id: String(created._id),
                    amount: created.amount,
                    date: created.date,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        if (error?.code === 11000) {
            return Response.json(
                { error: 'A starting balance has already been set.' },
                { status: 409 },
            );
        }
        console.error('Failed to save current balance:', error);
        return Response.json(
            { error: 'Unable to save current balance. Please try again.' },
            { status: 500 },
        );
    }
}
