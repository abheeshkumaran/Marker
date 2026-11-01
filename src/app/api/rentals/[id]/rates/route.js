export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import RentalRate from '@/models/RentalRate';
import {
    applyRateToEntries,
    loadRates,
    loadRental,
    parseDay,
    serializeRate,
} from '@/lib/rentals';

// POST /api/rentals/:id/rates  { effectiveFrom, amount, captain }
// Creates the payment structure, or changes it from `effectiveFrom` onwards.
// Saving again for the same date replaces that version.
export async function POST(request, { params }) {
    const { user, rental, response } = await loadRental(request, params);
    if (response) return response;

    const data = await request.json().catch(() => ({}));
    const effectiveFrom = parseDay(data.effectiveFrom);
    const amount = Number(data.amount);
    const captain = typeof data.captain === 'string' ? data.captain.trim().replace(/\s+/g, ' ') : '';

    const errors = {};
    if (!effectiveFrom) errors.effectiveFrom = 'Choose the date this takes effect from.';
    if (data.amount === '' || !Number.isFinite(amount) || amount < 0)
        errors.amount = 'Enter a valid daily amount.';
    if (!captain || captain.length > 60) errors.captain = 'Captain name is required (up to 60 characters).';
    if (Object.keys(errors).length) return Response.json({ errors }, { status: 422 });

    const rate = await RentalRate.findOneAndUpdate(
        { rentalId: rental._id, effectiveFrom },
        { $set: { amount, captain }, $setOnInsert: { userId: user._id } },
        { upsert: true, new: true, runValidators: true },
    ).lean();

    const rates = await loadRates(rental._id);
    await applyRateToEntries(rental._id, rates, rate);

    return Response.json({ rate: serializeRate(rate) }, { status: 201 });
}
