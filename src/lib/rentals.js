import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import RentalEntry from '@/models/RentalEntry';
import RentalRate from '@/models/RentalRate';
import RentalSource from '@/models/RentalSource';
import { getAuthenticatedUser, forbiddenResponse, unauthorizedResponse } from '@/lib/authorization';

const dayMs = 24 * 60 * 60 * 1000;

export const paymentTypes = ['Cash', 'UPI', 'Bank transfer', 'Card', 'Other'];

// 'YYYY-MM-DD' -> UTC midnight Date, or null if invalid.
export function parseDay(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

// The viewer's local date (sent by the page) so rows appear at their midnight, not UTC's.
// Clamped to within a day of the server clock.
export function resolveToday(value) {
    const now = new Date();
    const serverToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const requested = parseDay(value);
    if (!requested || Math.abs(requested - serverToday) > dayMs) return serverToday;
    return requested;
}

// Rates sorted by effectiveFrom; returns the one in force on `date`.
export function rateFor(rates, date) {
    let current = null;
    for (const rate of rates) {
        if (rate.effectiveFrom <= date) current = rate;
        else break;
    }
    return current;
}

export function pendingOf(payment, success, advance) {
    return Math.max(0, Math.round((payment - success - advance) * 100) / 100);
}

export function serializeEntry(entry) {
    return {
        id: String(entry._id),
        date: entry.date,
        captain: entry.captain,
        payment: entry.payment,
        success: entry.success,
        paymentType: entry.paymentType,
        advance: entry.advance,
        pending: entry.pending,
        remark: entry.remark,
        status: entry.status,
        recorded: Boolean(entry.recordedAt),
    };
}

export function serializeRate(rate) {
    return {
        id: String(rate._id),
        effectiveFrom: rate.effectiveFrom,
        amount: rate.amount,
        captain: rate.captain,
    };
}

// Auth + ownership check shared by the /api/rentals/:id routes.
export async function loadRental(request, params) {
    const user = await getAuthenticatedUser(request);
    if (!user) return { response: unauthorizedResponse() };
    if (user.role === 'superadmin') return { response: forbiddenResponse() };

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return { response: Response.json({ error: 'Invalid id.' }, { status: 400 }) };
    }

    await dbConnect();
    const rental = await RentalSource.findOne({ _id: id, userId: user._id }).lean();
    if (!rental) {
        return { response: Response.json({ error: 'Rental not found.' }, { status: 404 }) };
    }
    return { user, rental };
}

export async function loadRates(rentalId) {
    return RentalRate.find({ rentalId }).sort({ effectiveFrom: 1 }).lean();
}

// Creates the missing pending row for every day from the first structure date up to `today`.
export async function ensureDailyEntries(user, rentalId, rates, today) {
    if (!rates.length) return;
    const start = rates[0].effectiveFrom;
    if (start > today) return;

    const existing = await RentalEntry.find(
        { rentalId, date: { $gte: start, $lte: today } },
        { date: 1 },
    ).lean();
    const have = new Set(existing.map((entry) => entry.date.getTime()));

    const missing = [];
    for (let time = start.getTime(); time <= today.getTime(); time += dayMs) {
        if (have.has(time)) continue;
        const date = new Date(time);
        const rate = rateFor(rates, date);
        missing.push({
            userId: user._id,
            rentalId,
            date,
            captain: rate.captain,
            payment: rate.amount,
            pending: rate.amount,
            status: rate.amount > 0 ? 'pending' : 'paid',
        });
    }

    if (missing.length) {
        // ordered:false so a row created concurrently (duplicate key) doesn't stop the rest
        await RentalEntry.insertMany(missing, { ordered: false }).catch((error) => {
            if (error?.code !== 11000 && !error?.writeErrors) throw error;
        });
    }
}

// After a structure change, refresh the amount and captain on the rows it covers that
// have no payment recorded yet. Rows with a recorded payment keep their values.
export async function applyRateToEntries(rentalId, rates, rate) {
    const next = rates.find((r) => r.effectiveFrom > rate.effectiveFrom);
    const dateRange = { $gte: rate.effectiveFrom, ...(next ? { $lt: next.effectiveFrom } : {}) };
    await RentalEntry.updateMany(
        { rentalId, date: dateRange, recordedAt: null },
        {
            $set: {
                captain: rate.captain,
                payment: rate.amount,
                pending: rate.amount,
                status: rate.amount > 0 ? 'pending' : 'paid',
            },
        },
    );
}
