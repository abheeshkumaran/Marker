export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import Payment from '@/models/Payment';
import { getAuthenticatedUser, forbiddenResponse, unauthorizedResponse } from '@/lib/authorization';

// PATCH /api/payments/:id  { status: 'pending' | 'paid' }
// Flipping pending -> paid bumps paidCount (capped at noOfPendings);
// paid -> pending decrements it (floored at 0).
export async function PATCH(request, { params }) {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedResponse();
    if (user.role === 'superadmin') return forbiddenResponse();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return Response.json({ error: 'Invalid id.' }, { status: 400 });
    }

    const { status } = await request.json().catch(() => ({}));
    if (status !== 'pending' && status !== 'paid') {
        return Response.json(
            { error: 'status must be "pending" or "paid".' },
            { status: 422 },
        );
    }

    await dbConnect();
    const payment = await Payment.findOne({ _id: id, userId: user._id });
    if (!payment) {
        return Response.json({ error: 'Payment not found.' }, { status: 404 });
    }

    if (payment.status !== status) {
        if (status === 'paid') {
            payment.paidCount = Math.min(payment.paidCount + 1, payment.noOfPendings);
        } else {
            payment.paidCount = Math.max(payment.paidCount - 1, 0);
        }
        payment.status = status;
        await payment.save();
    }

    return Response.json({
        payment: {
            id: String(payment._id),
            date: payment.date,
            duePayment: payment.duePayment,
            transferTo: payment.transferTo,
            noOfPendings: payment.noOfPendings,
            paidCount: payment.paidCount,
            status: payment.status,
        },
    });
}
