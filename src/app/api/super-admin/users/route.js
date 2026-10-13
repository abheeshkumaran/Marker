export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/mongoose';
import Expense from '@/models/Expense';
import Income from '@/models/Income';
import User from '@/models/User';
import { getSuperAdmin } from '@/lib/authorization';

export async function GET(request) {
    if (!(await getSuperAdmin(request))) {
        return Response.json({ error: 'Super-admin access is required.' }, { status: 403 });
    }

    try {
        await dbConnect();
        const [users, incomes, expenses] = await Promise.all([
            User.find({ role: { $ne: 'superadmin' } }, 'username createdAt')
                .sort({ createdAt: -1 })
                .lean(),
            Income.find({}).sort({ date: -1, createdAt: -1 }).lean(),
            Expense.find({}).sort({ date: -1, createdAt: -1 }).lean(),
        ]);

        const userSummaries = users.map((user) => {
            const userId = String(user._id);
            const userIncome = incomes
                .filter((income) => String(income.userId) === userId)
                .map((income) => ({
                    date: income.date,
                    source:
                        income.source === 'opening_balance' ? 'Opening balance' : income.source,
                    amount: income.amount,
                }));
            const userExpenses = expenses
                .filter((expense) => String(expense.userId) === userId)
                .map((expense) => ({
                    date: expense.date,
                    purpose: expense.purpose,
                    amount: expense.amount,
                }));
            const totalIncome = userIncome.reduce((sum, income) => sum + income.amount, 0);
            const totalExpenses = userExpenses.reduce((sum, expense) => sum + expense.amount, 0);

            return {
                id: userId,
                username: user.username,
                createdAt: user.createdAt,
                income: userIncome,
                expenses: userExpenses,
                currentBalance: totalIncome - totalExpenses,
            };
        });

        return Response.json({ users: userSummaries });
    } catch (error) {
        console.error('Failed to load super-admin financial overview:', error);
        return Response.json(
            { error: 'Unable to load account summaries. Please try again.' },
            { status: 500 },
        );
    }
}
