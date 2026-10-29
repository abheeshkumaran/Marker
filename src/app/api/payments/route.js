export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/mongoose';
import Payment from '@/models/Payment';
import { getAuthenticatedUser, forbiddenResponse, unauthorizedResponse } from '@/lib/authorization';
import { serializePayment } from '@/lib/payments';

// GET /api/payments — list reminders, soonest due first; completed ones last.
export async function GET(request) {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedResponse();
    if (user.role === 'superadmin') return forbiddenResponse();

    await dbConnect();
    const rows = await Payment.find({ userId: user._id })
        .sort({ status: 1, date: 1, createdAt: -1 })
        .lean();
    return Response.json({ payments: rows.map(serializePayment) });
}

// POST /api/payments — create a payment reminder.
// { date, transferTo, duePayment, noOfPendings, paidCount? }
// `date` is the due date of the next unpaid installment.
export async function POST(request) {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedResponse();
    if (user.role === 'superadmin') return forbiddenResponse();

    const data = await request.json().catch(() => ({}));

    const dateString = typeof data.date === 'string' ? data.date : '';
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
        ? new Date(`${dateString}T00:00:00.000Z`)
        : null;
    const duePayment = Number(data.duePayment);
    const transferTo = String(data.transferTo || '').trim();
    const noOfPendings = Number(data.noOfPendings);
    const paidCount = data.paidCount === undefined || data.paidCount === '' ? 0 : Number(data.paidCount);

    const errors = {};
    if (!date || Number.isNaN(date.getTime())) errors.date = 'A valid payment date is required.';
    if (!transferTo) errors.transferTo = 'Payment info is required.';
    if (data.duePayment === '' || !Number.isFinite(duePayment) || duePayment < 0)
        errors.duePayment = 'Enter a valid amount.';
    if (!Number.isInteger(noOfPendings) || noOfPendings < 1)
        errors.noOfPendings = 'Total installments must be a whole number of at least 1.';
    else if (!Number.isInteger(paidCount) || paidCount < 0 || paidCount >= noOfPendings)
        errors.paidCount = `Installments already paid must be between 0 and ${noOfPendings - 1}.`;

    if (Object.keys(errors).length) {
        return Response.json({ errors }, { status: 422 });
    }

    await dbConnect();
    const created = await Payment.create({
        userId: user._id,
        date,
        dueDay: date.getUTCDate(),
        duePayment,
        transferTo,
        noOfPendings,
        paidCount,
        status: 'pending',
    });

    return Response.json({ payment: serializePayment(created) }, { status: 201 });
}
