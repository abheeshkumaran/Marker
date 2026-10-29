export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import Payment from '@/models/Payment';
import { getAuthenticatedUser, forbiddenResponse, unauthorizedResponse } from '@/lib/authorization';
import { addMonths, serializePayment } from '@/lib/payments';

async function findPayment(request, params) {
    const user = await getAuthenticatedUser(request);
    if (!user) return { response: unauthorizedResponse() };
    if (user.role === 'superadmin') return { response: forbiddenResponse() };

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return { response: Response.json({ error: 'Invalid id.' }, { status: 400 }) };
    }

    await dbConnect();
    const payment = await Payment.findOne({ _id: id, userId: user._id });
    if (!payment) {
        return { response: Response.json({ error: 'Payment not found.' }, { status: 404 }) };
    }
    return { payment };
}

// PATCH /api/payments/:id  { action: 'pay' | 'undo' }
// 'pay' marks the next installment paid and moves the due date to the following month;
// the last installment completes the reminder. 'undo' reverses the most recent payment.
export async function PATCH(request, { params }) {
    const { payment, response } = await findPayment(request, params);
    if (response) return response;

    const { action } = await request.json().catch(() => ({}));
    if (action !== 'pay' && action !== 'undo') {
        return Response.json({ error: 'action must be "pay" or "undo".' }, { status: 422 });
    }

    const dueDay = payment.dueDay || payment.date.getUTCDate();
    if (action === 'pay') {
        if (payment.paidCount >= payment.noOfPendings) {
            return Response.json({ error: 'All installments are already paid.' }, { status: 409 });
        }
        payment.paidCount += 1;
        if (payment.paidCount < payment.noOfPendings) {
            payment.date = addMonths(payment.date, 1, dueDay);
        }
    } else {
        if (payment.paidCount <= 0) {
            return Response.json({ error: 'No paid installments to undo.' }, { status: 409 });
        }
        // the due date only moved forward if that payment didn't complete the reminder
        if (payment.paidCount < payment.noOfPendings) {
            payment.date = addMonths(payment.date, -1, dueDay);
        }
        payment.paidCount -= 1;
    }
    payment.status = payment.paidCount >= payment.noOfPendings ? 'paid' : 'pending';
    await payment.save();

    return Response.json({ payment: serializePayment(payment) });
}

// DELETE /api/payments/:id
export async function DELETE(request, { params }) {
    const { payment, response } = await findPayment(request, params);
    if (response) return response;

    await payment.deleteOne();
    return Response.json({ ok: true });
}
