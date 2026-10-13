export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/mongoose';
import Expense from '@/models/Expense';
import Income from '@/models/Income';
import {
    forbiddenResponse,
    getAuthenticatedUser,
    unauthorizedResponse,
} from '@/lib/authorization';

const resetConfirmation = 'RESET FINANCIAL DATA';

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

    if (data?.confirmation !== resetConfirmation) {
        return Response.json(
            { error: `Type "${resetConfirmation}" to confirm this reset.` },
            { status: 400 },
        );
    }

    try {
        await dbConnect();
        const [incomeResult, expenseResult] = await Promise.all([
            Income.deleteMany({ userId: user._id }),
            Expense.deleteMany({ userId: user._id }),
        ]);
        return Response.json({
            deleted: {
                income: incomeResult.deletedCount,
                expenses: expenseResult.deletedCount,
            },
        });
    } catch (error) {
        console.error('Failed to reset financial data:', error);
        return Response.json(
            { error: 'Unable to reset financial data. Please try again.' },
            { status: 500 },
        );
    }
}
