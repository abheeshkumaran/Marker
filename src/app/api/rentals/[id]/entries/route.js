export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import RentalEntry from '@/models/RentalEntry';
import {
    loadRates,
    loadRental,
    parseDay,
    paymentTypes,
    pendingOf,
    rateFor,
    serializeEntry,
} from '@/lib/rentals';

function money(value) {
    if (value === undefined || value === null || value === '') return 0;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : NaN;
}

// POST /api/rentals/:id/entries
// { date, captain, success, paymentType, advance, remark }
// Records the payment for a day. The amount due comes from the payment structure in force
// on that date; pending = due - success - advance.
export async function POST(request, { params }) {
    const { user, rental, response } = await loadRental(request, params);
    if (response) return response;

    const data = await request.json().catch(() => ({}));
    const date = parseDay(data.date);
    const success = money(data.success);
    const advance = money(data.advance);
    const paymentType = typeof data.paymentType === 'string' ? data.paymentType.trim() : '';
    const captain = typeof data.captain === 'string' ? data.captain.trim().replace(/\s+/g, ' ') : '';
    const remark = typeof data.remark === 'string' ? data.remark.trim() : '';

    const rates = await loadRates(rental._id);
    const rate = date ? rateFor(rates, date) : null;

    const errors = {};
    if (!date) errors.date = 'Choose a valid date.';
    else if (!rate) {
        errors.date = rates.length
            ? 'This date is before the payment structure starts.'
            : 'Create a payment structure first.';
    }
    if (Number.isNaN(success)) errors.success = 'Enter a valid amount received.';
    if (Number.isNaN(advance)) errors.advance = 'Enter a valid advance.';
    if ((success > 0 || advance > 0) && !paymentTypes.includes(paymentType))
        errors.paymentType = 'Choose a payment type.';
    if (!captain || captain.length > 60) errors.captain = 'Captain name is required.';
    if (remark.length > 200) errors.remark = 'Remark can be up to 200 characters.';
    if (Object.keys(errors).length) return Response.json({ errors }, { status: 422 });

    const existing = await RentalEntry.findOne({ rentalId: rental._id, date }).lean();
    // a row keeps the due amount it was created with unless it was never paid
    const payment = existing?.recordedAt ? existing.payment : rate.amount;
    const pending = pendingOf(payment, success, advance);

    const entry = await RentalEntry.findOneAndUpdate(
        { rentalId: rental._id, date },
        {
            $set: {
                captain,
                payment,
                success,
                paymentType: success > 0 || advance > 0 ? paymentType : '',
                advance,
                pending,
                remark,
                status: pending === 0 ? 'paid' : 'pending',
                recordedAt: new Date(),
            },
            $setOnInsert: { userId: user._id },
        },
        { upsert: true, new: true, runValidators: true },
    ).lean();

    return Response.json({ entry: serializeEntry(entry) }, { status: 201 });
}
