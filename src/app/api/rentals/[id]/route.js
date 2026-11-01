export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import RentalEntry from '@/models/RentalEntry';
import RentalRate from '@/models/RentalRate';
import RentalSource from '@/models/RentalSource';
import {
    ensureDailyEntries,
    loadRates,
    loadRental,
    resolveToday,
    serializeEntry,
    serializeRate,
} from '@/lib/rentals';

// GET /api/rentals/:id?today=YYYY-MM-DD
// Creates any missing daily rows up to today, then returns the structure history and all rows.
export async function GET(request, { params }) {
    const { user, rental, response } = await loadRental(request, params);
    if (response) return response;

    const today = resolveToday(new URL(request.url).searchParams.get('today'));
    const rates = await loadRates(rental._id);
    await ensureDailyEntries(user, rental._id, rates, today);
    const entries = await RentalEntry.find({ rentalId: rental._id }).sort({ date: -1 }).lean();

    return Response.json({
        rental: { id: String(rental._id), name: rental.name },
        today: today.toISOString().slice(0, 10),
        rates: rates.map(serializeRate),
        entries: entries.map(serializeEntry),
    });
}

// DELETE /api/rentals/:id — removes the rental with its payment structure and rows.
export async function DELETE(request, { params }) {
    const { rental, response } = await loadRental(request, params);
    if (response) return response;

    await Promise.all([
        RentalEntry.deleteMany({ rentalId: rental._id }),
        RentalRate.deleteMany({ rentalId: rental._id }),
        RentalSource.deleteOne({ _id: rental._id }),
    ]);
    return Response.json({ ok: true });
}
