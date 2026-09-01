export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/mongoose';
import Payment from '@/models/Payment';

function serialize(p) {
    return {
        id: String(p._id),
        date: p.date,
        duePayment: p.duePayment,
        transferTo: p.transferTo,
        noOfPendings: p.noOfPendings,
        paidCount: p.paidCount,
        status: p.status,
    };
}

// GET /api/payments — list all payments (newest first).
export async function GET() {
    await dbConnect();
    const rows = await Payment.find({}).sort({ createdAt: -1 }).lean();
    return Response.json({ payments: rows.map(serialize) });
}

// POST /api/payments — create a payment reminder.
export async function POST(request) {
    const data = await request.json().catch(() => ({}));

    const date = data.date ? new Date(data.date) : null;
    const duePayment = Number(data.duePayment);
    const transferTo = String(data.transferTo || '').trim();
    const noOfPendings = parseInt(data.noOfPendings, 10);

    const errors = {};
    if (!date || Number.isNaN(date.getTime())) errors.date = 'A valid payment date is required.';
    if (Number.isNaN(duePayment) || duePayment < 0) errors.duePayment = 'Enter a valid amount.';
    if (!transferTo) errors.transferTo = 'Transfer to is required.';
    if (!Number.isInteger(noOfPendings) || noOfPendings < 1)
        errors.noOfPendings = 'Number of pendings must be a positive integer.';

    if (Object.keys(errors).length) {
        return Response.json({ errors }, { status: 422 });
    }

    await dbConnect();
    const created = await Payment.create({
        date,
        duePayment,
        transferTo,
        noOfPendings,
        paidCount: 0,
        status: 'pending',
    });

    return Response.json({ payment: serialize(created) }, { status: 201 });
}
