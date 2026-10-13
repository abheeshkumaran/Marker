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
        const [incomes, expenses] = await Promise.all([
            Income.find({ userId: user._id }).sort({ date: -1, createdAt: -1 }).lean(),
            Expense.find({ userId: user._id }).sort({ date: -1, createdAt: -1 }).lean(),
        ]);

        const transactions = [
            ...incomes.map((income) => ({
                id: String(income._id),
                date: income.date,
                type: 'income',
                description:
                    income.source === 'opening_balance' ? 'Net Balance' : income.source,
                amount: income.amount,
            })),
            ...expenses.map((expense) => ({
                id: String(expense._id),
                date: expense.date,
                type: 'expense',
                description: expense.purpose,
                amount: expense.amount,
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return Response.json({ transactions });
    } catch (error) {
        console.error('Failed to load transaction statement:', error);
        return Response.json(
            { error: 'Unable to load transactions. Please try again.' },
            { status: 500 },
        );
    }
}
